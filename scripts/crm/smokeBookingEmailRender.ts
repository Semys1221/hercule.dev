/** Smoke test: booking email render rules (plain vs React HTML). */

import assert from "node:assert/strict";

import {
  defaultUseHtml,
  finalizeRenderedEmail,
} from "@/lib/booking-communication/signatures";

async function main() {
  assert.equal(defaultUseHtml("immediate"), false);
  assert.equal(defaultUseHtml("role_seq_48"), false);
  assert.equal(defaultUseHtml("h48_confirm"), true);
  assert.equal(defaultUseHtml("h20_cancel"), true);

  const immediate = await finalizeRenderedEmail({
    subject: "Test",
    body: "Bonjour,\n\nContenu.",
    emailType: "immediate",
  });
  assert.ok(!immediate.html, "immediate must not include html");
  assert.match(immediate.text, /Hercule/);

  const h48 = await finalizeRenderedEmail({
    subject: "Test",
    body: "Jean,\n\nMerci de confirmer :\n{{confirmation_agence_link}}",
    emailType: "h48_confirm",
    confirmUrl: "https://www.hercule.dev/confirm-reservation.html/x?email=a@b.c",
  });
  assert.ok(h48.html, "h48 must include html");
  assert.match(h48.html!, /Confirmer ma présence/i);
  assert.match(h48.html!, /background-color:#09090[Bb]/i);
  assert.match(h48.html!, /background-color:#ffffff/i);

  const override = await finalizeRenderedEmail({
    subject: "Test",
    body: "Jean,\n\nContenu.",
    emailType: "h48_confirm",
    useHtml: false,
  });
  assert.ok(!override.html, "useHtml:false must skip html");

  console.log("booking email render smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
