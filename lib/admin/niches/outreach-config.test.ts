/** Unit tests for niche outreach config env fallbacks. */

import assert from "node:assert/strict";

const CAMPAIGN_ENV = {
  agence: "INSTANTLY_CAMPAIGN_ID_AGENCE",
  entreprise: "INSTANTLY_CAMPAIGN_ID_ENTREPRISE",
  comptable: "INSTANTLY_CAMPAIGN_ID_COMPTABLE",
} as const;

function campaignIdFromEnv(niche: keyof typeof CAMPAIGN_ENV): string | null {
  const primary = process.env[CAMPAIGN_ENV[niche]]?.trim();
  if (primary) {
    return primary;
  }
  if (niche === "comptable") {
    return process.env.COMPTABLE_CAMPAIGN_ID?.trim() || null;
  }
  if (niche === "entreprise") {
    return process.env.LINK_PROVISIONING_CAMPAIGN_ID?.trim() || null;
  }
  return null;
}

const previous = {
  agence: process.env.INSTANTLY_CAMPAIGN_ID_AGENCE,
  comptable: process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE,
  provisioning: process.env.LINK_PROVISIONING_CAMPAIGN_ID,
};

process.env.INSTANTLY_CAMPAIGN_ID_AGENCE = "11111111-1111-4111-8111-111111111111";
process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE = "22222222-2222-4222-8222-222222222222";
process.env.LINK_PROVISIONING_CAMPAIGN_ID = "33333333-3333-4333-8333-333333333333";

assert.equal(
  campaignIdFromEnv("agence"),
  "11111111-1111-4111-8111-111111111111",
);
assert.equal(
  campaignIdFromEnv("comptable"),
  "22222222-2222-4222-8222-222222222222",
);
assert.equal(
  campaignIdFromEnv("entreprise"),
  "33333333-3333-4333-8333-333333333333",
);

if (previous.agence === undefined) {
  delete process.env.INSTANTLY_CAMPAIGN_ID_AGENCE;
} else {
  process.env.INSTANTLY_CAMPAIGN_ID_AGENCE = previous.agence;
}
if (previous.comptable === undefined) {
  delete process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE;
} else {
  process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE = previous.comptable;
}
if (previous.provisioning === undefined) {
  delete process.env.LINK_PROVISIONING_CAMPAIGN_ID;
} else {
  process.env.LINK_PROVISIONING_CAMPAIGN_ID = previous.provisioning;
}

console.log("outreach-config env fallback tests passed");
