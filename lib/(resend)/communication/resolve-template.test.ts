/** Tests for entreprise template resolution and stale copy detection. */

import assert from "node:assert/strict";

import {
  isStaleAgenceCopyOnEntreprise,
  pickBookingEmailTemplate,
} from "@/lib/(resend)/communication/template-store";
import {
  defaultBookingEmailTemplate,
  renderTemplate,
} from "@/lib/(resend)/communication/templates";
import { buildClientDashboardUrl } from "@/lib/clients/supabase";

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

  assert.match(resolved.subject, /Préparez votre audit de compatibilité/i);
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

  assert.match(resolvedH24.subject, /Votre audit Hercule approche/i);
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

  const stub = defaultBookingEmailTemplate("client", "payment_onboarding_1");
  const fromStub = pickBookingEmailTemplate({
    category: "client",
    emailType: "payment_onboarding_1",
    verticalOverride: "dec",
    stored: stub,
  });
  assert.ok(fromStub.body.length > stub.body.length);
  assert.match(fromStub.body, /\{\{dashboardLink\}\}/);

  const slug = "suivi-test";
  const dashboardLink = buildClientDashboardUrl(slug);
  const rendered = renderTemplate(fromStub.body, {
    dashboardLink,
    email: "client@example.com",
  });
  assert.match(rendered, new RegExp(`/clients/${slug}`));
  assert.equal(rendered.includes(`/dashboard/${slug}`), false);

  const missingLink = pickBookingEmailTemplate({
    category: "client",
    emailType: "payment_onboarding_1",
    verticalOverride: "cif",
    stored: {
      subject: "Sujet stocké sans lien",
      body: "Bonjour, votre accès est actif.",
    },
  });
  assert.match(missingLink.body, /\{\{dashboardLink\}\}/);
  assert.notEqual(missingLink.subject, "Sujet stocké sans lien");

  const customWithLink = pickBookingEmailTemplate({
    category: "client",
    emailType: "payment_onboarding_4",
    verticalOverride: "ias",
    stored: {
      subject: "Sujet custom",
      body: "Suivez ici : {{dashboardLink}}",
    },
  });
  assert.equal(customWithLink.subject, "Sujet custom");
  assert.equal(customWithLink.body, "Suivez ici : {{dashboardLink}}");

  console.log("entreprise template resolve tests passed");
}

main();
