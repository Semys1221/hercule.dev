/** Smoke test: booking email render rules (plain vs React HTML). */

import assert from "node:assert/strict";

import {
  defaultUseHtml,
  finalizeRenderedEmail,
  SIGNATURE_TAGLINES,
} from "@/lib/booking-communication/signatures";
import { sampleMeetingActionLinks } from "@/lib/booking-communication/meeting-links";

function htmlIncludesTagline(html: string, tagline: string): boolean {
  return html.includes(tagline) || html.includes(tagline.replace(/&/g, "&amp;"));
}

async function main() {
  assert.equal(defaultUseHtml("immediate"), false);
  assert.equal(defaultUseHtml("role_seq_48"), false);
  assert.equal(defaultUseHtml("h48_confirm"), true);
  assert.equal(defaultUseHtml("h20_cancel"), true);

  const immediate = await finalizeRenderedEmail({
    category: "agence",
    subject: "Test",
    body: "Bonjour,\n\nContenu.",
    emailType: "immediate",
  });
  assert.ok(!immediate.html, "immediate must not include html");
  assert.match(immediate.text, /Hercule/);
  assert.ok(immediate.text.includes(SIGNATURE_TAGLINES.agence));
  assert.doesNotMatch(
    immediate.text,
    /Rejoindre la réunion/,
    "immediate must not include meeting action links",
  );

  const immediateOverride = await finalizeRenderedEmail({
    category: "agence",
    subject: "Test",
    body: "Bonjour,\n\nContenu.",
    emailType: "immediate",
    useHtml: true,
  });
  assert.ok(
    !immediateOverride.html,
    "immediate must not include html even with useHtml:true",
  );

  const confirmUrl =
    "https://www.hercule.dev/confirm-reservation.html/x?email=a@b.c";
  const meetingActionLinks = sampleMeetingActionLinks();

  const h48 = await finalizeRenderedEmail({
    category: "agence",
    subject: "Test",
    body: `Jean,\n\nMerci de confirmer :\n${confirmUrl}`,
    emailType: "h48_confirm",
    confirmUrl,
    meetingActionLinks,
  });
  assert.ok(h48.html, "h48 must include html");
  assert.match(h48.html!, /Confirmer ma présence/i);
  assert.ok(htmlIncludesTagline(h48.html!, SIGNATURE_TAGLINES.agence));
  assert.match(h48.html!, /background-color:#ffffff/i);
  assert.match(h48.html!, /background-color:#171717/i);
  assert.match(h48.text, /Confirmer ma présence : https:\/\//);
  assert.ok(h48.text.includes(SIGNATURE_TAGLINES.agence));
  assert.match(
    h48.text,
    /Rejoindre la réunion : https:\/\/meet\.google\.com\/abc-defg-hij \| Replanifier la réunion/,
  );
  assert.match(h48.text, /Annuler la réunion : https:\/\/calendly\.com\/cancellations\/EXAMPLE/);
  assert.match(h48.html!, /Rejoindre la réunion/);
  assert.match(h48.html!, /Replanifier la réunion/);
  assert.match(h48.html!, /Annuler la réunion/);
  assert.doesNotMatch(h48.html!, /background-color:#09090[Bb]/i);

  const entreprisePostUrl =
    "https://www.hercule.dev/post-booking-entreprise.html/x?email=a@b.c";
  const entrepriseH48 = await finalizeRenderedEmail({
    category: "entreprise",
    subject: "Préparez votre rendez-vous",
    body: `Jean,\n\nPour préparer au mieux votre rendez-vous :\n{{post_booking_link}}`,
    emailType: "h48_confirm",
    confirmUrl: entreprisePostUrl,
    meetingActionLinks,
  });
  assert.ok(entrepriseH48.html, "entreprise h48 must include html");
  assert.match(entrepriseH48.html!, /Consulter/i);
  assert.match(entrepriseH48.html!, /Rejoindre la réunion/);
  assert.ok(entrepriseH48.text.includes(SIGNATURE_TAGLINES.entreprise));
  assert.ok(htmlIncludesTagline(entrepriseH48.html!, SIGNATURE_TAGLINES.entreprise));
  assert.doesNotMatch(entrepriseH48.text, /Courtage de projets Web & Tech/i);

  const entrepriseH24 = await finalizeRenderedEmail({
    category: "entreprise",
    subject: "Rappel",
    body: "Jean,\n\nVotre rendez-vous approche — le mercredi 10 septembre 2026 à 09:00.",
    emailType: "h24_relance",
    meetingActionLinks,
  });
  assert.ok(entrepriseH24.html, "entreprise h24 must include html");
  assert.match(entrepriseH24.text, /Rejoindre la réunion/);
  assert.ok(entrepriseH24.text.includes(SIGNATURE_TAGLINES.entreprise));
  assert.doesNotMatch(entrepriseH24.html!, /Confirmer ma présence/i);
  assert.doesNotMatch(entrepriseH24.text, /Courtage de projets Web & Tech/i);

  const entrepriseImmediate = await finalizeRenderedEmail({
    category: "entreprise",
    subject: "Confirmation",
    body: "Jean,\n\nVotre rendez-vous est confirmé.",
    emailType: "immediate",
  });
  assert.ok(entrepriseImmediate.text.includes(SIGNATURE_TAGLINES.entreprise));
  assert.doesNotMatch(entrepriseImmediate.text, /Courtage de projets Web & Tech/i);

  const entrepriseDefaults = (
    await import("@/lib/booking-communication/templates")
  ).defaultBookingEmailTemplate("entreprise", "h48_confirm");
  const entrepriseResolvedPreview = await finalizeRenderedEmail({
    category: "entreprise",
    subject: entrepriseDefaults.subject,
    body: entrepriseDefaults.body.replace(
      "{{post_booking_link}}",
      entreprisePostUrl,
    ),
    emailType: "h48_confirm",
    confirmUrl: entreprisePostUrl,
    meetingActionLinks,
  });
  assert.doesNotMatch(entrepriseResolvedPreview.text, /réattribué/i);
  assert.doesNotMatch(entrepriseResolvedPreview.text, /Confirmer ma présence/i);
  assert.match(entrepriseResolvedPreview.text, /consulter :/i);
  assert.ok(entrepriseResolvedPreview.text.includes(SIGNATURE_TAGLINES.entreprise));

  const override = await finalizeRenderedEmail({
    category: "agence",
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
