import { readFileSync } from "node:fs";
import path from "node:path";

import { getBookingFromAddress } from "@/lib/booking-communication/templates";
import { getResendClient } from "@/lib/resend";

const ASSETS_DIR =
  "/Users/evqn/.cursor/projects/Users-evqn-dev-hercule-dev/assets";

const SCREENSHOTS = [
  "Screenshot_2026-09-15_at_12.25.47-8d5a0bae-f1d2-44b9-ba19-097e19be612c.png",
  "Screenshot_2026-09-15_at_12.25.52-e669cebc-9829-491b-b6bc-0c24882c73f5.png",
  "Screenshot_2026-09-15_at_15.53.02-a9721363-b9f5-411b-a87a-d19a1ec93d93.png",
  "Screenshot_2026-09-15_at_12.32.33-421b8880-121f-4a11-96e1-f791f7b6c945.png",
  "Screenshot_2026-09-15_at_15.47.40-7c03a105-0755-47b8-9592-0da4f1b47804.png",
];

const SUBJECT = "Suite à votre candidature web Hercule";

const RECIPIENTS: Array<{ email: string; firstName: string | null }> = [
  { email: "addigitaldirection@gmail.com", firstName: "Dayana" },
  { email: "bcuriel@shin-agency.com", firstName: null },
  { email: "contact@57informatique.fr", firstName: null },
  { email: "contact@chef-et-dev.fr", firstName: null },
  { email: "contact@referencemoi.com", firstName: "Stéphane" },
  { email: "david.beaufils@nr-communication.fr", firstName: "David" },
  { email: "expert-ads@adsposition.fr", firstName: null },
  { email: "firas.amrouche@nextrise.fr", firstName: "Firas" },
  { email: "floriandsweb@outlook.fr", firstName: null },
  { email: "jenouvriera@gmail.com", firstName: "Alexandre" },
  { email: "n.nottebaert@outlook.com", firstName: "Nathalie" },
  { email: "nicolas.bouchet@square-info.fr", firstName: "Nicolas" },
  { email: "redac.expres@gmail.com", firstName: null },
  { email: "selimaklil@icloud.com", firstName: "Sélim" },
  { email: "stephane@littlelessconversation.fr", firstName: "Stéphane" },
  { email: "stephanie.rennard@gmail.com", firstName: "Stéphanie" },
  { email: "steeven@evensy.fr", firstName: "Steeven" },
  { email: "thuillier@whatifthelightningbold.fr", firstName: "Gaëtan" },
];

function buildText(firstName: string | null): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  return `${greeting}

Suite à votre candidature web Hercule (RDV annulé de notre côté), nous ouvrons un test accès illimité à notre pipeline de rendez-vous visio avec des cabinets comptables et des conseillers en investissement financier : 1 200 € le 1er mois.

Condition : offre d'acquisition mensuelle. Aperçu du pipeline en PJ.

Répondez avec le nom de l'agence + votre téléphone pour candidater.

Hercule
contact@hercule.dev`;
}

function buildHtml(firstName: string | null): string {
  const greeting = firstName ? `Bonjour ${firstName},` : "Bonjour,";

  return `<p>${greeting}</p>
<p>Suite à votre candidature web Hercule (RDV annulé de notre côté), nous ouvrons un <strong>test accès illimité</strong> à notre pipeline de rendez-vous visio avec des cabinets comptables et des conseillers en investissement financier : 1 200 € le 1er mois.</p>
<p>Condition : offre d'acquisition mensuelle. Aperçu du pipeline en PJ.</p>
<p>Répondez avec le nom de l'agence + votre téléphone pour candidater.</p>
<p>Hercule<br>contact@hercule.dev</p>`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const resend = getResendClient();
  const attachments = SCREENSHOTS.map((filename, index) => ({
    filename: `pipeline-${index + 1}.png`,
    content: readFileSync(path.join(ASSETS_DIR, filename)),
  }));

  const results: Array<{ email: string; ok: boolean; id?: string; error?: string }> =
    [];

  for (const recipient of RECIPIENTS) {
    const { data, error } = await resend.emails.send(
      {
        from: getBookingFromAddress(),
        to: [recipient.email],
        subject: SUBJECT,
        text: buildText(recipient.firstName),
        html: buildHtml(recipient.firstName),
        attachments,
      },
      {
        idempotencyKey: `agence-pipeline-campaign-2026-09-15-${recipient.email}`,
      },
    );

    if (error) {
      results.push({ email: recipient.email, ok: false, error: error.message });
      console.error(`FAILED ${recipient.email}:`, error.message);
    } else {
      results.push({ email: recipient.email, ok: true, id: data?.id });
      console.log(`OK ${recipient.email} -> ${data?.id}`);
    }

    await sleep(600);
  }

  const sent = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\nDone: ${sent}/${RECIPIENTS.length} sent`);
  if (failed.length > 0) {
    console.log("Failures:", failed);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
