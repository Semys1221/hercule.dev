import assert from "node:assert/strict";

import {
  CLIENT_DEC_ENGAGEMENT_LABEL,
  clientEngagementLabel,
} from "./conference-pricing";

assert.equal(
  clientEngagementLabel({
    clientType: "dec",
    billing: "monthly",
  }),
  CLIENT_DEC_ENGAGEMENT_LABEL,
);
assert.equal(CLIENT_DEC_ENGAGEMENT_LABEL, "Renouvellement optionnel");

assert.equal(
  clientEngagementLabel({
    clientType: "dec",
    billing: "pack",
  }),
  "Pack prépayé — pas d'abonnement récurrent",
);

assert.equal(
  clientEngagementLabel({
    clientType: "cif",
    billing: "monthly",
  }),
  CLIENT_DEC_ENGAGEMENT_LABEL,
);

assert.equal(
  clientEngagementLabel({
    clientType: "cif",
    billing: "pack",
  }),
  "Pack prépayé — pas d'abonnement récurrent",
);

assert.equal(
  clientEngagementLabel({
    clientType: "ias",
    billing: "monthly",
  }),
  CLIENT_DEC_ENGAGEMENT_LABEL,
);

console.log("conference-pricing.test.ts OK");
