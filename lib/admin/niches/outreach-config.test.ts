/** Unit tests for niche outreach config env fallbacks. */

import assert from "node:assert/strict";

import {
  calendlyUriFromEnv,
  campaignIdFromEnv,
} from "@/lib/admin/niches/outreach-config";

const previous = {
  agence: process.env.INSTANTLY_CAMPAIGN_ID_AGENCE,
  comptable: process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE,
  comptableAlt: process.env.COMPTABLE_CAMPAIGN_ID,
  provisioning: process.env.LINK_PROVISIONING_CAMPAIGN_ID,
  calendlyComptable: process.env.CALENDLY_EVENT_TYPE_URI_COMPTABLE,
};

process.env.INSTANTLY_CAMPAIGN_ID_AGENCE = "11111111-1111-4111-8111-111111111111";
process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE = "22222222-2222-4222-8222-222222222222";
process.env.LINK_PROVISIONING_CAMPAIGN_ID = "33333333-3333-4333-8333-333333333333";
delete process.env.COMPTABLE_CAMPAIGN_ID;

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

delete process.env.INSTANTLY_CAMPAIGN_ID_COMPTABLE;
process.env.COMPTABLE_CAMPAIGN_ID = "44444444-4444-4444-8444-444444444444";
assert.equal(
  campaignIdFromEnv("comptable"),
  "44444444-4444-4444-8444-444444444444",
);

process.env.CALENDLY_EVENT_TYPE_URI_COMPTABLE =
  "https://api.calendly.com/event_types/COMPTABLE";
assert.equal(
  calendlyUriFromEnv("comptable"),
  "https://api.calendly.com/event_types/COMPTABLE",
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
if (previous.comptableAlt === undefined) {
  delete process.env.COMPTABLE_CAMPAIGN_ID;
} else {
  process.env.COMPTABLE_CAMPAIGN_ID = previous.comptableAlt;
}
if (previous.provisioning === undefined) {
  delete process.env.LINK_PROVISIONING_CAMPAIGN_ID;
} else {
  process.env.LINK_PROVISIONING_CAMPAIGN_ID = previous.provisioning;
}
if (previous.calendlyComptable === undefined) {
  delete process.env.CALENDLY_EVENT_TYPE_URI_COMPTABLE;
} else {
  process.env.CALENDLY_EVENT_TYPE_URI_COMPTABLE = previous.calendlyComptable;
}

console.log("outreach-config env fallback tests passed");
