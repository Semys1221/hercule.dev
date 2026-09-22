import assert from "node:assert/strict";

import type { ClientRow } from "@/lib/clients/types";

import {
  FIRST_LEAD_DELAY_DAYS,
  clientEligibility,
  firstLeadAtFrom,
  hasConsumedRoundRobinQuota,
  isEligibleClient,
  leadCategoryToVertical,
  pickClient,
  plannedShares,
  remainingQuota,
  consumeRoundRobinQuota,
  restoreRoundRobinQuota,
  RR_QUOTA_PROFILE_KEY,
} from "./round-robin";

function client(partial: Partial<ClientRow> = {}): ClientRow {
  return {
    id: "client-a",
    email: "a@test.fr",
    slug: "aaaaaa",
    first_name: "A",
    client_type: "dec",
    secondary_vertical: null,
    billing: "monthly",
    offer_type: "conference_dec_monthly",
    rdv_total: 10,
    rdv_used: 0,
    first_lead_at: "2020-01-01T00:00:00.000Z",
    calendly_scheduling_url: "https://calendly.com/cabinet-a/30min",
    calendly_event_type_uri: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    product_statut: "IN_DELIVERANCE",
    onboarding_completed_at: "2020-01-01T00:00:00.000Z",
    retraction_status: null,
    retraction_ends_at: null,
    retraction_waived_at: null,
    profile: {},
    created_at: "2020-01-01T00:00:00.000Z",
    updated_at: "2020-01-01T00:00:00.000Z",
    ...partial,
  };
}

assert.equal(FIRST_LEAD_DELAY_DAYS, 20);
assert.equal(leadCategoryToVertical("comptable"), "dec");
assert.equal(leadCategoryToVertical("cif"), "cif");
assert.equal(leadCategoryToVertical("agence"), null);

const created = new Date("2026-01-01T00:00:00.000Z");
assert.equal(firstLeadAtFrom(created), "2026-01-21T00:00:00.000Z");

const eligible = client();
assert.equal(clientEligibility(eligible), "eligible");
assert.equal(isEligibleClient(eligible), true);
assert.equal(remainingQuota(eligible), 10);

assert.equal(
  clientEligibility(client({ first_lead_at: "2099-01-01T00:00:00.000Z" })),
  "too_early",
);
assert.equal(isEligibleClient(client({ first_lead_at: "2099-01-01T00:00:00.000Z" })), false);
assert.equal(clientEligibility(client({ rdv_used: 10 })), "quota_full");
assert.equal(
  clientEligibility(client({ calendly_scheduling_url: null })),
  "no_calendly",
);
assert.equal(
  clientEligibility(client({ onboarding_completed_at: null })),
  "not_onboarded",
);
assert.equal(clientEligibility(client({ product_statut: "CANCELLED" })), "inactive");

const a = client({ id: "a", rdv_total: 10, rdv_used: 0 });
const b = client({
  id: "b",
  email: "b@test.fr",
  slug: "bbbbbb",
  rdv_total: 10,
  rdv_used: 5,
  first_lead_at: "2020-01-02T00:00:00.000Z",
});
const shares = plannedShares([a, b]);
assert.equal(shares.get("a")?.sharePct, 10 / 15 * 100);
assert.equal(shares.get("b")?.sharePct, 5 / 15 * 100);

const noCal = client({
  id: "c",
  calendly_scheduling_url: null,
  rdv_total: 20,
});
assert.equal(plannedShares([a, noCal]).get("c")?.sharePct, 0);
assert.equal(plannedShares([a, noCal]).get("a")?.sharePct, 100);

const counts: Record<string, number> = { a: 0, b: 0 };
const first = pickClient([a, b], counts);
assert.equal(first?.id, "a");
counts.a = 1;
const second = pickClient([a, b], counts);
assert.equal(second?.id, "b");
counts.b = 1;
const third = pickClient([a, b], counts);
assert.equal(third?.id, "a");

assert.equal(pickClient([], {}), null);
assert.equal(pickClient([client({ rdv_used: 10 })], {}), null);

assert.equal(hasConsumedRoundRobinQuota(null), false);
assert.equal(hasConsumedRoundRobinQuota({}), false);
assert.equal(
  hasConsumedRoundRobinQuota({ [RR_QUOTA_PROFILE_KEY]: "2026-01-01T00:00:00.000Z" }),
  true,
);

type Store = {
  profile: Record<string, unknown> | null;
  rdvUsed: number;
};

function mockSupabase(store: Store) {
  return {
    from(table: string) {
      return {
        update(payload: Record<string, unknown>) {
          if (table === "comptable" && payload.profile) {
            store.profile = payload.profile as Record<string, unknown>;
          }
          if (table === "clients" && typeof payload.rdv_used === "number") {
            store.rdvUsed = payload.rdv_used;
          }
          return {
            eq: async () => ({ error: null }),
          };
        },
        select() {
          return {
            eq: () => ({
              maybeSingle: async () => ({
                data: { rdv_used: store.rdvUsed },
                error: null,
              }),
            }),
          };
        },
      };
    },
  };
}

const store: Store = { profile: {}, rdvUsed: 3 };
const supabase = mockSupabase(store) as never;

async function runQuotaCases() {
  const consumed = await consumeRoundRobinQuota({
    supabase,
    category: "comptable",
    leadId: "lead-1",
    clientId: "client-a",
    profile: {},
  });
  assert.ok(hasConsumedRoundRobinQuota(consumed));
  assert.equal(store.rdvUsed, 4);

  const consumedAgain = await consumeRoundRobinQuota({
    supabase,
    category: "comptable",
    leadId: "lead-1",
    clientId: "client-a",
    profile: consumed,
  });
  assert.equal(store.rdvUsed, 4);
  assert.equal(consumedAgain, consumed);

  const restored = await restoreRoundRobinQuota({
    supabase,
    category: "comptable",
    leadId: "lead-1",
    clientId: "client-a",
    profile: consumed,
  });
  assert.equal(hasConsumedRoundRobinQuota(restored), false);
  assert.equal(store.rdvUsed, 3);

  const restoredAgain = await restoreRoundRobinQuota({
    supabase,
    category: "comptable",
    leadId: "lead-1",
    clientId: "client-a",
    profile: restored,
  });
  assert.equal(store.rdvUsed, 3);
  assert.equal(restoredAgain, restored);
}

void runQuotaCases()
  .then(() => {
    console.log("round-robin.test.ts: ok");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
