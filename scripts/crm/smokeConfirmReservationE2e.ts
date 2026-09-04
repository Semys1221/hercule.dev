/**
 * End-to-end smoke test: fake MEETING_BOOKED lead → confirm API → CONFIRMED.
 *
 * Usage: pnpm smoke-confirm-reservation-e2e
 */
import fs from "node:fs";
import path from "node:path";

import { createLinkTrackingClient } from "@/lib/link-tracking/supabase";
import { buildLeadUrls } from "@/lib/link-tracking/urls";

const ROOT = process.cwd();

type ConfirmResponse = {
  ok?: boolean;
  alreadyConfirmed?: boolean;
  statut?: string;
  reason?: string;
  error?: string;
};

function assertPathSlugSupport(): void {
  const vercel = JSON.parse(
    fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8"),
  ) as { rewrites?: Array<{ source?: string }> };
  const hasRewrite = (vercel.rewrites ?? []).some((rule) =>
    rule.source?.includes("confirm-reservation.html/:slug"),
  );
  if (!hasRewrite) {
    throw new Error("vercel.json missing confirm-reservation.html/:slug rewrite");
  }

  const confirmPage = fs.readFileSync(
    path.join(ROOT, "public/confirm-reservation.html"),
    "utf8",
  );
  if (!confirmPage.includes("confirm-reservation\\.html\\/([^/]+)")) {
    throw new Error("confirm-reservation.html must parse path slug");
  }

  console.log("OK static: path slug rewrite + parsing present");
}

function randomSlug(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 4; i += 1) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `smk${suffix}`;
}

async function postConfirm(
  baseUrl: string,
  payload: { slug: string; email: string },
): Promise<{ status: number; body: ConfirmResponse }> {
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/link-tracking/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await response.text();
  try {
    return { status: response.status, body: JSON.parse(raw) as ConfirmResponse };
  } catch {
    throw new Error(
      `Confirm API returned non-JSON from ${baseUrl}. ` +
        "Set CRM_BACKEND_URL=http://localhost:3000 when running against local dev.",
    );
  }
}

async function main(): Promise<void> {
  assertPathSlugSupport();

  const baseUrl =
    process.env.CRM_BACKEND_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3000";

  const client = createLinkTrackingClient();
  const timestamp = Date.now();
  const bookedEmail = `smoke-confirm-${timestamp}@hercule.dev`;
  const guardEmail = `smoke-confirm-guard-${timestamp}@hercule.dev`;
  const bookedSlug = randomSlug();
  const guardSlug = randomSlug();
  const scheduledAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const leadIds: string[] = [];

  try {
    const { data: bookedLead, error: bookedInsertError } = await client
      .from("agence")
      .insert({
        email: bookedEmail,
        slug: bookedSlug,
        statut: "MEETING_BOOKED",
        scheduled_at: scheduledAt,
        first_name: "Smoke",
        company: "E2E Test",
        ...buildLeadUrls(bookedSlug, bookedEmail),
      })
      .select("id, slug, email, statut")
      .single();

    if (bookedInsertError || !bookedLead) {
      throw new Error(`Failed to insert booked lead: ${bookedInsertError?.message}`);
    }
    leadIds.push(bookedLead.id);

    const { data: guardLead, error: guardInsertError } = await client
      .from("agence")
      .insert({
        email: guardEmail,
        slug: guardSlug,
        statut: "NOTBOOKED",
        first_name: "Smoke",
        company: "E2E Guard",
        ...buildLeadUrls(guardSlug, guardEmail),
      })
      .select("id")
      .single();

    if (guardInsertError || !guardLead) {
      throw new Error(`Failed to insert guard lead: ${guardInsertError?.message}`);
    }
    leadIds.push(guardLead.id);

    console.log(`OK setup: created leads ${bookedEmail} (${bookedSlug}), ${guardEmail}`);

    const confirm = await postConfirm(baseUrl, {
      slug: bookedSlug,
      email: bookedEmail,
    });
    if (confirm.status !== 200 || confirm.body.ok !== true || confirm.body.statut !== "CONFIRMED") {
      throw new Error(
        `Expected CONFIRMED for MEETING_BOOKED lead, got ${confirm.status} ${JSON.stringify(confirm.body)}`,
      );
    }
    console.log("OK live: MEETING_BOOKED lead confirmed via API");

    const { data: afterConfirm, error: afterConfirmError } = await client
      .from("agence")
      .select("statut, confirmed_at")
      .eq("id", bookedLead.id)
      .single();

    if (afterConfirmError || !afterConfirm) {
      throw new Error(`Failed to read confirmed lead: ${afterConfirmError?.message}`);
    }
    if (afterConfirm.statut !== "CONFIRMED" || !afterConfirm.confirmed_at) {
      throw new Error(
        `Expected CONFIRMED with confirmed_at, got ${JSON.stringify(afterConfirm)}`,
      );
    }
    console.log("OK data: Supabase statut is CONFIRMED with confirmed_at");

    const idempotent = await postConfirm(baseUrl, {
      slug: bookedSlug,
      email: bookedEmail,
    });
    if (
      idempotent.status !== 200 ||
      idempotent.body.ok !== true ||
      idempotent.body.alreadyConfirmed !== true
    ) {
      throw new Error(
        `Expected idempotent alreadyConfirmed, got ${idempotent.status} ${JSON.stringify(idempotent.body)}`,
      );
    }
    console.log("OK live: idempotent confirm returns alreadyConfirmed");

    const guard = await postConfirm(baseUrl, {
      slug: guardSlug,
      email: guardEmail,
    });
    if (guard.status !== 409 || guard.body.reason !== "not_booked_yet") {
      throw new Error(
        `Expected 409 not_booked_yet for NOTBOOKED lead, got ${guard.status} ${JSON.stringify(guard.body)}`,
      );
    }
    console.log("OK live: NOTBOOKED lead rejected with not_booked_yet");

    console.log("All confirm reservation E2E checks passed.");
  } finally {
    if (leadIds.length > 0) {
      const { error: cleanupError } = await client.from("agence").delete().in("id", leadIds);
      if (cleanupError) {
        console.warn(`Cleanup warning: ${cleanupError.message}`);
      } else {
        console.log(`OK cleanup: removed ${leadIds.length} smoke lead(s)`);
      }
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
