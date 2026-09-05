/** Tests for entreprise template resolution and stale copy detection. */

import assert from "node:assert/strict";

import {
  isStaleAgenceCopyOnEntreprise,
  pickBookingEmailTemplate,
} from "@/lib/booking-communication/template-store";
import { defaultBookingEmailTemplate } from "@/lib/booking-communication/templates";

const STALE_AGENCE_BODY = `{{firstNameLine}}

Nous avons le plaisir de vous informer que les profils présentés lors de votre rendez-vous porteront sur des contrats de conseil financier.

Afin de maintenir votre créneau, merci de confirmer votre présence :
{{confirmation_agence_link}}

Sans confirmation sous 24 heures, votre place pourra être réattribué à une autre agence.`;

function main() {
  assert.equal(
    isStaleAgenceCopyOnEntreprise(
      "entreprise",
      "h48_confirm",
      "Confirmation requise — Votre rendez-vous avec Hercule",
      STALE_AGENCE_BODY,
    ),
    true,
  );

  const entrepriseDefaults = defaultBookingEmailTemplate("entreprise", "h48_confirm");
  assert.equal(
    isStaleAgenceCopyOnEntreprise(
      "entreprise",
      "h48_confirm",
      entrepriseDefaults.subject,
      entrepriseDefaults.body,
    ),
    false,
  );

  assert.equal(
    isStaleAgenceCopyOnEntreprise(
      "agence",
      "h48_confirm",
      "Confirmation requise",
      STALE_AGENCE_BODY,
    ),
    false,
  );

  const resolved = pickBookingEmailTemplate({
    category: "entreprise",
    emailType: "h48_confirm",
    subject: "",
    body: "",
    stored: {
      subject: "Confirmation requise — Votre rendez-vous avec Hercule",
      body: STALE_AGENCE_BODY,
    },
  });

  assert.match(resolved.subject, /Préparez votre rendez-vous/i);
  assert.match(resolved.body, /{{post_booking_link}}/);
  assert.doesNotMatch(resolved.body, /réattribué/i);
  assert.doesNotMatch(resolved.body, /confirmer votre présence/i);

  const resolvedH24 = pickBookingEmailTemplate({
    category: "entreprise",
    emailType: "h24_relance",
    stored: {
      subject: "Confirmation requise — Votre rendez-vous avec Hercule",
      body: STALE_AGENCE_BODY,
    },
  });

  assert.match(resolvedH24.subject, /Rappel/i);
  assert.match(resolvedH24.body, /{{date}}/);
  assert.doesNotMatch(resolvedH24.body, /réattribué/i);

  const editorOverride = pickBookingEmailTemplate({
    category: "entreprise",
    emailType: "h48_confirm",
    subject: "Objet custom",
    body: "Corps custom entreprise",
    stored: {
      subject: "Confirmation requise",
      body: STALE_AGENCE_BODY,
    },
  });
  assert.equal(editorOverride.subject, "Objet custom");
  assert.equal(editorOverride.body, "Corps custom entreprise");

  console.log("entreprise template resolve tests passed");
}

main();
