/** Unit tests for Absent ? email body and signature rendering. */

import assert from "node:assert/strict";

import {
  buildNotPresentBody,
  renderNotPresentEmail,
} from "@/lib/admin/bookings/not-present-email";
import { SIGNATURE_TAGLINES } from "@/lib/booking-communication/signatures";
import { HERCULE_CONTACT_EMAIL, HERCULE_LOGO_URL } from "@/emails/constants";

async function main() {
  const body = buildNotPresentBody("Marie", "2026-09-10T09:00:00+02:00");
  assert.match(body, /Bonjour Marie,/);
  assert.match(body, /Votre rendez-vous avec Hercule était prévu à/);
  assert.match(body, /Êtes-vous toujours disponible/);
  assert.doesNotMatch(body, /contact@hercule\.dev/, "body alone must not include signature");

  const rendered = await renderNotPresentEmail({
    firstName: "Marie",
    startTime: "2026-09-10T09:00:00+02:00",
    category: "agence",
  });

  assert.match(rendered.text, /Hercule/);
  assert.ok(rendered.text.includes(SIGNATURE_TAGLINES.agence));
  assert.ok(rendered.text.includes(HERCULE_CONTACT_EMAIL));
  assert.match(rendered.html, /Hercule/);
  assert.match(rendered.html, /Courtage de projets Web/);
  assert.match(rendered.html, new RegExp(HERCULE_LOGO_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));

  const entrepriseRendered = await renderNotPresentEmail({
    firstName: "Jean",
    startTime: null,
    category: "entreprise",
  });
  assert.ok(entrepriseRendered.text.includes(SIGNATURE_TAGLINES.entreprise));
  assert.doesNotMatch(
    entrepriseRendered.text,
    /Courtage de projets Web & Tech/,
    "entreprise tagline must differ from agence",
  );

  console.log("not-present-email.test.ts: ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
