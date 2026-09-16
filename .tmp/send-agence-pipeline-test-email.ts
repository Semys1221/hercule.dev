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

const subject = "Suite à votre candidature web Hercule";

const text = `Bonjour Evan,

Suite à votre candidature web Hercule (RDV annulé de notre côté), nous ouvrons 1 accès test pour 1 agence sur notre pipeline de RDV visio avec dirigeants TPE/PME qualifiés.

1 200 € / mois le 1er mois · garantie 1 500 € / mois · panier moyen 1 500–2 500 €.

Condition : offre d'acquisition mensuelle. Aperçu du pipeline en PJ.

Répondez avec le nom de l'agence + votre téléphone pour candidater.

Hercule
contact@hercule.dev`;

const html = text
  .split("\n\n")
  .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
  .join("");

async function main() {
  const resend = getResendClient();
  const attachments = SCREENSHOTS.map((filename, index) => ({
    filename: `pipeline-${index + 1}.png`,
    content: readFileSync(path.join(ASSETS_DIR, filename)),
  }));

  const { data, error } = await resend.emails.send({
    from: getBookingFromAddress(),
    to: ["nanguy29@gmail.com"],
    subject,
    text,
    html,
    attachments,
  });

  if (error) {
    console.error("Resend error:", error);
    process.exit(1);
  }

  console.log("Email sent:", data?.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
