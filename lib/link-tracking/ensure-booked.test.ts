/** Unit tests for ensureLeadBookedBeforeConfirm promotion guard. */

import assert from "node:assert/strict";

import { shouldPromoteLeadBeforeConfirm } from "@/lib/link-tracking/book-lead";

function main() {
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "MEETING_BOOKED", scheduled_at: "2026-09-09T10:00:00Z" }),
    false,
  );
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "BOOKED", scheduled_at: "2026-09-09T10:00:00Z" }),
    false,
  );
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "CONFIRMED", scheduled_at: "2026-09-09T10:00:00Z" }),
    false,
  );
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "CLICKED", scheduled_at: "2026-09-09T10:00:00Z" }),
    true,
  );
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "NOTBOOKED", scheduled_at: "2026-09-09T10:00:00Z" }),
    true,
  );
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "NOTBOOKED", scheduled_at: null }),
    false,
  );
  assert.equal(
    shouldPromoteLeadBeforeConfirm({ statut: "CLICKED", scheduled_at: "  " }),
    false,
  );

  console.log("OK ensure-booked-before-confirm unit tests passed");
}

main();
