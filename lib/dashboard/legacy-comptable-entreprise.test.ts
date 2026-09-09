/** Unit tests for legacy comptable entreprise lead detection. */
import assert from "node:assert/strict";

import { isLegacyComptableEntrepriseLead } from "./legacy-comptable-entreprise";

assert.equal(
  isLegacyComptableEntrepriseLead({
    reservation_comptable_link: "https://hercule.dev/reservation-comptable",
    confirmation_comptable_link: null,
  }),
  true,
);

assert.equal(
  isLegacyComptableEntrepriseLead({
    reservation_comptable_link: null,
    confirmation_comptable_link: null,
  }),
  false,
);

console.log("legacy-comptable-entreprise.test.ts: ok");
