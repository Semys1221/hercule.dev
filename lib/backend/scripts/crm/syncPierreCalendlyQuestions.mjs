/**
 * Copy custom questions from hercule-cif-clone onto Pierre's Rendez-vous comptable via Calendly UI.
 *
 * Usage: node scripts/crm/syncPierreCalendlyQuestions.mjs
 */
import { chromium } from "@playwright/test";
import path from "node:path";

const PIERRE_USER_ID = "4896f471-1265-4326-9f64-441f08cd22de";
const EVENT_TYPE_ID = "26bb3452-334a-4492-9032-3ba1d2c3f9d0";
const EVENT_NAME = "Rendez-vous comptable";
const PROFILE_DIR = path.join(process.cwd(), ".calendly-playwright-profile");

const QUESTIONS = [
  {
    label: "Quelle est la nature de votre activité e-commerce ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "Marque e-commerce / D2C",
      "Boutique en ligne",
      "Vente sur Amazon / marketplaces",
      "Dropshipping",
      "Autre",
    ],
  },
  {
    label: "Combien de personnes travaillent actuellement dans votre entreprise ?",
    type: "Multiple choice",
    required: true,
    choices: ["1", "2–5", "6–10", "11–20", "20+"],
  },
  {
    label: "Quel est votre chiffre d'affaires annuel ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "Moins de 100 000 €",
      "100 000 à 250 000 €",
      "250 000 à 500 000 €",
      "500 000 à 1 M€",
      "Plus de 1 M€",
    ],
  },
  {
    label: "Quel est l'objectif de votre rendez-vous ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "Faire le point sur ma situation comptable et fiscale",
      "Identifier des pistes d'optimisation pour mon entreprise",
      "Évaluer un accompagnement comptable et fiscal pour mon entreprise et moi-même",
      "Je souhaite simplement me renseigner",
    ],
  },
  {
    label: "Quels sujets souhaitez-vous principalement améliorer ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "Fiscalité de l'entreprise",
      "Rémunération du dirigeant",
      "Trésorerie",
      "Rentabilité / marges",
      "Pilotage financier",
      "Gestion comptable",
      "Plusieurs de ces sujets",
    ],
  },
  {
    label: "Quel niveau d'accompagnement recherchez-vous ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "Une stratégie d'économies sur l'ensemble (mensuel)",
      "Un coup de main ponctuel ",
    ],
  },
  {
    label:
      "À quelle fréquence souhaitez-vous pouvoir échanger avec votre interlocuteur comptable ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "Selon mes besoins",
      "Une fois par trimestre",
      "Une fois par mois",
      "Régulièrement selon l'actualité de l'entreprise",
    ],
  },
  {
    label:
      "Quel budget mensuel souhaitez-vous consacrer à votre comptabilité et à votre accompagnement ?",
    type: "Multiple choice",
    required: true,
    choices: [
      "180 €/mois — Comptabilité de l'entreprise",
      "250 €/mois — Comptabilité + accompagnement fiscal du dirigeant",
      "350 €/mois — Comptabilité + accompagnement fiscal et conseil du dirigeant",
      "Autres",
    ],
  },
  {
    label:
      "Si une solution adaptée était identifiée lors de l'échange, à quel horizon souhaiteriez-vous démarrer ?",
    type: "Multiple choice",
    required: true,
    choices: ["Dès que possible", "Dans les 30 jours", "Dans les 90 jours"],
  },
  {
    label: "Votre numéro de téléphone",
    type: "Phone number",
    required: true,
    choices: [],
  },
];

async function ensureLoggedIn(page) {
  await page.goto("https://calendly.com/app/scheduling/meeting_types", {
    waitUntil: "domcontentloaded",
  });
  if (!page.url().includes("/login")) return;

  console.log("Please log in to Calendly (Google SSO). Waiting up to 5 minutes...");
  const google = page.getByRole("button", { name: /log in with google/i });
  if (await google.isVisible().catch(() => false)) {
    await google.click();
  }
  await page.waitForURL(/calendly\.com\/app\/(?!login)/, { timeout: 300_000 });
}

async function openEventQuestions(page) {
  const urls = [
    `https://calendly.com/app/scheduling/meeting_types/user/${PIERRE_USER_ID}/event_type/${EVENT_TYPE_ID}`,
    `https://calendly.com/app/scheduling/meeting_types/user/${PIERRE_USER_ID}`,
  ];
  for (const url of urls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    if (!page.url().includes("/login")) break;
  }

  const event = page.getByRole("link", { name: EVENT_NAME }).first();
  if (await event.isVisible().catch(() => false)) {
    await event.click();
    await page.waitForTimeout(1000);
  }

  const edit = page.getByRole("link", { name: /^edit$/i }).or(page.getByRole("button", { name: /^edit$/i }));
  if (await edit.first().isVisible().catch(() => false)) {
    await edit.first().click();
    await page.waitForTimeout(1000);
  }

  const questionsTab = page
    .getByRole("link", { name: /invitee questions|questions pour les invités/i })
    .or(page.getByRole("button", { name: /invitee questions|questions pour les invités/i }))
    .or(page.getByText(/invitee questions|questions pour les invités/i));
  await questionsTab.first().click({ timeout: 30_000 });
  await page.waitForTimeout(1000);
}

async function removeExistingQuestions(page) {
  for (let i = 0; i < 5; i++) {
    const deleteBtn = page
      .getByRole("button", { name: /delete|remove|supprimer|trash/i })
      .first();
    if (!(await deleteBtn.isVisible().catch(() => false))) break;
    await deleteBtn.click();
    const confirm = page.getByRole("button", { name: /delete|remove|supprimer|confirm/i }).last();
    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
    await page.waitForTimeout(500);
  }
}

async function addQuestion(page, question) {
  await page.getByRole("button", { name: /add question|ajouter une question/i }).click();
  await page.waitForTimeout(500);

  const typeSelect = page.locator('[data-testid="question-type-select"], select').last();
  if (await typeSelect.isVisible().catch(() => false)) {
    await typeSelect.selectOption({ label: question.type }).catch(async () => {
      await page.getByText(question.type, { exact: false }).click();
    });
  } else {
    await page.getByText(question.type, { exact: false }).first().click();
  }

  await page.locator('input[name*="question"], textarea').last().fill(question.label);

  for (const choice of question.choices) {
    await page.getByRole("button", { name: /add choice|add option|ajouter/i }).last().click();
    await page.locator('input[placeholder*="choice" i], input[placeholder*="option" i], input[placeholder*="réponse" i]').last().fill(choice);
    await page.keyboard.press("Enter").catch(() => {});
  }

  if (question.required) {
    const required = page.getByLabel(/required|obligatoire/i).last();
    if (await required.isVisible().catch(() => false)) {
      await required.check().catch(() => required.click());
    }
  }

  await page.getByRole("button", { name: /apply|done|save|enregistrer|terminé/i }).last().click();
  await page.waitForTimeout(700);
}

async function saveEvent(page) {
  const save = page.getByRole("button", { name: /^save$|save changes|enregistrer|update/i }).first();
  if (await save.isVisible().catch(() => false)) {
    await save.click();
    await page.waitForTimeout(2000);
  }
}

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: "chrome",
    viewport: { width: 1440, height: 960 },
  });
  const page = context.pages()[0] ?? await context.newPage();

  try {
    await ensureLoggedIn(page);
    await openEventQuestions(page);
    await removeExistingQuestions(page);

    for (const question of QUESTIONS) {
      console.log(`Adding: ${question.label}`);
      await addQuestion(page, question);
    }

    await saveEvent(page);
    console.log("Done.");
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
