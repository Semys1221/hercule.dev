import assert from "node:assert/strict";

import type { ClientRow } from "@/lib/clients/types";

import { deleteConferenceClient } from "./delete-client";

const CLIENT_ID = "11111111-1111-1111-1111-111111111111";

function sampleClient(): ClientRow {
  return {
    id: CLIENT_ID,
    email: "pending+test@checkout.hercule.dev",
    slug: "abcdef",
    first_name: null,
    client_type: "dec",
    secondary_vertical: null,
    billing: "monthly",
    offer_type: "conference_dec_monthly",
    rdv_total: 10,
    rdv_used: 0,
    first_lead_at: "2020-01-01T00:00:00.000Z",
    calendly_scheduling_url: null,
    calendly_event_type_uri: null,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    renewal_choice: null,
    renewal_choice_at: null,
    renewal_prompt_closed_at: null,
    product_statut: "NONE",
    onboarding_completed_at: null,
    retraction_status: null,
    retraction_ends_at: null,
    retraction_waived_at: null,
    profile: {},
    created_at: "2020-01-01T00:00:00.000Z",
    updated_at: "2020-01-01T00:00:00.000Z",
  };
}

type MockState = {
  client: ClientRow | null;
  jobsDeleted: boolean;
  clientDeleted: boolean;
};

function mockSupabase(state: MockState) {
  return {
    from(table: string) {
      if (table === "clients") {
        return {
          select() {
            return {
              eq: () => ({
                maybeSingle: async () => ({
                  data: state.client,
                  error: null,
                }),
              }),
            };
          },
          delete() {
            return {
              eq: () => ({
                select: () => ({
                  maybeSingle: async () => {
                    if (!state.client) {
                      return { data: null, error: null };
                    }
                    state.clientDeleted = true;
                    state.client = null;
                    return { data: { id: CLIENT_ID }, error: null };
                  },
                }),
              }),
            };
          },
        };
      }
      if (table === "booking_email_jobs") {
        return {
          delete() {
            return {
              eq: (_col: string, value: string) => ({
                eq: async (col2: string, value2: string) => {
                  assert.equal(_col, "lead_category");
                  assert.equal(value, "client");
                  assert.equal(col2, "lead_id");
                  assert.equal(value2, CLIENT_ID);
                  state.jobsDeleted = true;
                  return { error: null };
                },
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

async function run() {
  const state: MockState = {
    client: sampleClient(),
    jobsDeleted: false,
    clientDeleted: false,
  };

  const result = await deleteConferenceClient({
    supabase: mockSupabase(state) as never,
    clientId: CLIENT_ID,
  });

  assert.equal(result.slug, "abcdef");
  assert.equal(result.email, "pending+test@checkout.hercule.dev");
  assert.equal(state.jobsDeleted, true);
  assert.equal(state.clientDeleted, true);

  await assert.rejects(
    () =>
      deleteConferenceClient({
        supabase: mockSupabase({ client: null, jobsDeleted: false, clientDeleted: false }) as never,
        clientId: CLIENT_ID,
      }),
    /Client not found/,
  );
}

void run()
  .then(() => {
    console.log("delete-client.test.ts: ok");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
