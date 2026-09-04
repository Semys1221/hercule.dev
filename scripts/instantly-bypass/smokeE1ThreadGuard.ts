/**
 * Smoke tests for E1 Unibox thread guard heuristics.
 *
 * Usage: tsx ./scripts/instantly-bypass/smokeE1ThreadGuard.ts
 */

import {
  countE1MarkersInSentEmails,
  countMandatairesInSentEmails,
  isDuplicateE1Thread,
  normalizeEmailText,
  threadAlreadyHasE1,
} from "@/lib/instantly-bypass/e1-thread-guard";

import type { InstantlyEmailRecord } from "@/lib/instantly-bypass/types";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function sent(body: string): InstantlyEmailRecord & Record<string, unknown> {
  return {
    id: "email-1",
    subject: "Re: question clients",
    body: { html: body },
  };
}

function run(): void {
  const e1Body =
    "Voici les precisions. L'un des groupes de clients est constitue de cabinets comptables de 3 a 12 mandataires. hercule.dev Beatrice Meyer";
  const single = [sent(e1Body)];
  assert(countMandatairesInSentEmails(single) === 1, "single mandataires message");
  assert(countE1MarkersInSentEmails(single) === 1, "single E1 marker");
  assert(!isDuplicateE1Thread(single), "single is not duplicate");

  const duplicate = [sent(e1Body), sent(e1Body.replace("Voici", "Encore voici"))];
  assert(countMandatairesInSentEmails(duplicate) === 2, "duplicate mandataires count");
  assert(isDuplicateE1Thread(duplicate), "duplicate thread detected");

  assert(
    normalizeEmailText("Mandataires") === "mandataires",
    "normalize lowercases",
  );

  console.log("OK smoke E1 thread guard");
}

if (process.env.RUN_E1_GUARD_LIVE === "1") {
  const apiKey = process.env.INSTANTLY_API_KEY?.trim();
  const campaignId = process.env.INSTANTLY_BYPASS_CAMPAIGN_ID?.trim();
  const leadEmail = process.env.SMOKE_LEAD_EMAIL?.trim();
  if (!apiKey || !campaignId || !leadEmail) {
    throw new Error("Set INSTANTLY_API_KEY, INSTANTLY_BYPASS_CAMPAIGN_ID, SMOKE_LEAD_EMAIL");
  }
  threadAlreadyHasE1(apiKey, { leadEmail, campaignId }).then((hasE1) => {
    console.log(`Live threadAlreadyHasE1(${leadEmail}) = ${hasE1}`);
  });
} else {
  run();
}
