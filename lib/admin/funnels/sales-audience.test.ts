import assert from "node:assert/strict";

import {
  isComptableSalesAudience,
  salesAudienceToLeadCategory,
} from "./sales-audience";

assert.equal(salesAudienceToLeadCategory("agence"), "agence");
assert.equal(salesAudienceToLeadCategory("entreprise"), "entreprise");
assert.equal(salesAudienceToLeadCategory("comptable"), "entreprise");
assert.equal(isComptableSalesAudience("comptable"), true);
assert.equal(isComptableSalesAudience("agence"), false);

console.log("sales-audience.test.ts: ok");
