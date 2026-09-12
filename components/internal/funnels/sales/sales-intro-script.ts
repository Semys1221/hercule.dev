import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";
import type { Audience } from "@/lib/admin/navigation";
import { isCabinetBuyerSalesAudience, isCifSalesAudience, isComptableSalesAudience } from "@/lib/admin/funnels/sales-audience";

export const SALES_DECLARATIVE_SCRIPT = `Toutes les questions restent du déclaratif : aujourd'hui je vais vous poser des questions, ce n'est pas une compétition, ni le but est de s'inventer des services. C'est du déclaratif certes, mais aujourd'hui si je vous attribue une agence en recherche d'un service de création web et que vous lui faites des réseaux sociaux c'est vous qui allez avoir un chargeback et un très mauvais retour client.

Et soyons honnêtes deux minutes : **on n'est plus en 2010 aujourd'hui. Le client est éduqué.** Plus personne ne fait de virement SEPA classique avec un petit libellé à l'ancienne. Tout passe par des agrégateurs de paiement comme Stripe. Et vous savez comment ça se passe : dès que vous accumulez trop de disputes et de clients mécontents, **c'est un aller simple pour vous faire bloquer vos comptes et fermer boutique. nous on garde le contact aussi avec ces clients** donc on ne pourra plus travailler ensemble.

Chez Hercule, on protège nos clients et on protège nos agences. On valide la compatibilité à 100 % pour que vous encaissiez vos projets sereinement. On joue cartes sur table. Ça vous va ?`;

export const COMPTABLE_DECLARATIVE_SCRIPT = `Toutes les questions restent du déclaratif : aujourd'hui je vais vous poser des questions, ce n'est pas une compétition, ni le but est de s'inventer des missions. C'est du déclaratif certes, mais si je vous attribue un dirigeant TPE en reprise de tenue comptable et que vous lui proposez un périmètre social alors que vous ne le pratiquez pas, c'est vous qui allez avoir un très mauvais retour client et une relation difficile à tenir.

Chez Hercule Comptable, on protège les dirigeants TPE et on protège nos cabinets partenaires. On valide la compatibilité à 100 % pour que vous honoriez vos missions sereinement — tenue, fiscal, obligations administratives. On joue cartes sur table. Ça vous va ?`;

export const CIF_DECLARATIVE_SCRIPT = `Toutes les questions restent du déclaratif : aujourd'hui je vais vous poser des questions, ce n'est pas une compétition, ni le but est de s'inventer des missions. C'est du déclaratif certes, mais si je vous attribue un dirigeant PME en optimisation fiscale et trésorerie et que vous lui proposez un périmètre hors de vos agréments CIF, c'est vous qui allez avoir un très mauvais retour client et une relation difficile à tenir.

Chez Hercule CIF, on protège les dirigeants PME et on protège nos cabinets partenaires. On valide la compatibilité à 100 % pour que vous honoriez vos mandats sereinement — patrimoine, trésorerie, transmission. On joue cartes sur table. Ça vous va ?`;

export function getSalesDeclarativeScript(audience: Audience = "agence"): string {
  if (audience === "cif") {
    return CIF_DECLARATIVE_SCRIPT;
  }
  return isCabinetBuyerSalesAudience(audience)
    ? COMPTABLE_DECLARATIVE_SCRIPT
    : SALES_DECLARATIVE_SCRIPT;
}

export type SalesIntroScriptFields = {
  firstName: string;
  teamSize: string | null;
  activities: string | null;
  budgetConfirmed: boolean;
};

const TEAM_SIZE_KEYS = [
  "salarié",
  "salariés",
  "équipe",
  "equipe",
  "taille",
  "collaborateur",
  "associé",
  "associés",
];
const ACTIVITY_KEYS = [
  "activité",
  "activite",
  "spécialité",
  "specialite",
  "expertise",
  "positionnement",
  "compétence",
  "competence",
  "mission",
];
const BUDGET_KEYS_AGENCE = ["budget", "tarif", "prix", "1500", "1 500", "produit d'appel"];
const BUDGET_KEYS_COMPTABLE = [
  "budget",
  "tarif",
  "prix",
  "honoraire",
  "998",
  "1499",
  "1 499",
  "formule",
];

function matchQuestionAnswer(
  questions: Record<string, string>,
  keys: string[],
): string | null {
  for (const [question, answer] of Object.entries(questions)) {
    const normalizedQuestion = question.toLowerCase();
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      continue;
    }
    if (keys.some((key) => normalizedQuestion.includes(key))) {
      return trimmedAnswer;
    }
  }
  return null;
}

function budgetConfirmedFromAnswer(answer: string | null, audience: Audience): boolean {
  if (!answer) {
    return false;
  }
  if (isCabinetBuyerSalesAudience(audience)) {
    return /9[\s.]?98|998|1[\s.]?499|1499|plus de|compatible/i.test(answer);
  }
  return /1[\s.]?500|1500|plus de/i.test(answer);
}

export function extractSalesIntroFields(
  booking: Pick<CalendlyBookingRow, "first_name" | "name" | "questions">,
  audience: Audience = "agence",
): SalesIntroScriptFields {
  const firstName =
    booking.first_name?.trim() ||
    booking.name.trim().split(/\s+/)[0] ||
    "Prospect";

  const teamSize = matchQuestionAnswer(booking.questions, TEAM_SIZE_KEYS);
  const activities = matchQuestionAnswer(booking.questions, ACTIVITY_KEYS);

  const budgetKeys = isCabinetBuyerSalesAudience(audience)
    ? BUDGET_KEYS_COMPTABLE
    : BUDGET_KEYS_AGENCE;
  const budgetAnswer = matchQuestionAnswer(booking.questions, budgetKeys);
  const budgetConfirmed = budgetConfirmedFromAnswer(budgetAnswer, audience);

  return {
    firstName,
    teamSize,
    activities,
    budgetConfirmed,
  };
}

export function buildSalesIntroScript(
  booking: Pick<CalendlyBookingRow, "first_name" | "name" | "questions">,
  audience: Audience = "agence",
): string {
  const fields = extractSalesIntroFields(booking, audience);
  const teamSize = fields.teamSize ?? "[Nombre de collaborateurs, ex: 4 à 8]";
  const activities =
    fields.activities ??
    (audience === "cif"
      ? "[Missions principales, ex: optimisation fiscale et trésorerie]"
      : "[Missions principales, ex: tenue comptable TPE et fiscal]");

  if (audience === "cif") {
    const eligibilityLine = fields.budgetConfirmed
      ? "Tu as confirmé les informations de ton formulaire Calendly — bande passante compatible avec nos mandats PME et positionnement aligné."
      : "Nous avons noté les informations de votre formulaire Calendly concernant votre cabinet et votre zone d'intervention.";

    return `${fields.firstName}, ravi de t'avoir en ligne — Evan d'Hercule CIF.

Écoute, j'ai ton dossier d'audit de compatibilité sous les yeux. J'ai bien noté que vous étiez actuellement ${teamSize} et que vous vous positionnez principalement sur ${activities}.

Le fonctionnement : Hercule reçoit et qualifie des demandes d'indépendants et de dirigeants PME/TPE en recherche d'accompagnement patrimonial, fiscal et de trésorerie.

Notre rôle,

- c'est de sélectionner le bon cabinet partenaire
- qualifier le besoin et la compatibilité cabinet-dirigeant
- établir la relation

Je fais en sorte que vous ne perdiez pas votre temps : tout ce que nous pourrons vous proposer restera dans la limite de vos expertises déclarées.

Le but : maintenir ce niveau de qualité sur les cabinets que nous recommandons et sur les mandats patrimoniaux / trésorerie qui vous sont proposés.

La première étape formulaire Calendly : ${eligibilityLine}

L'objectif c'est de continuer :

- profil cabinet : vos honoraires, votre capacité, vos attentes
- les mandats PME qui vous sont éligibles`;
  }

  if (isComptableSalesAudience(audience)) {
    const eligibilityLine = fields.budgetConfirmed
      ? "Tu as confirmé les informations de ton formulaire Calendly — bande passante compatible avec nos missions TPE et positionnement aligné."
      : "Nous avons noté les informations de votre formulaire Calendly concernant votre cabinet et votre zone d'intervention.";

    return `${fields.firstName}, ravi de t'avoir en ligne — Evan d'Hercule Comptable.

Écoute, j'ai ton dossier d'audit de compatibilité sous les yeux. J'ai bien noté que vous étiez actuellement ${teamSize} et que vous vous positionnez principalement sur ${activities}.

Le fonctionnement : Hercule reçoit et qualifie des demandes de dirigeants TPE en reprise comptable, fiscale et administrative.

Notre rôle,

- c'est de sélectionner le bon cabinet partenaire
- qualifier le besoin et la compatibilité cabinet-TPE
- établir la relation

Je fais en sorte que vous ne perdiez pas votre temps : tout ce que nous pourrons vous proposer restera dans la limite de vos expertises déclarées.

Le but : maintenir ce niveau de qualité sur les cabinets que nous recommandons et sur les missions TPE qui vous sont proposées.

La première étape formulaire Calendly : ${eligibilityLine}

L'objectif c'est de continuer :

- profil cabinet : vos honoraires, votre capacité, vos attentes
- les missions TPE qui vous sont éligibles`;
  }

  const budgetLine = fields.budgetConfirmed
    ? "Tu as confirmé que votre produit d'appel démarre à plus de 1 500 €, ce qui est un premier bon point pour correspondre aux budgets de nos clients."
    : "Nous avons noté les informations de votre formulaire Calendly concernant vos tarifs et votre positionnement.";

  return `${fields.firstName}, ravi de t'avoir en ligne Evan d'Hercule.

Écoute, j'ai ton dossier de candidature sous les yeux. J'ai bien noté que vous étiez actuellement ${teamSize} et que vous vous positionnez principalement sur ${activities}.

Le fonctionnement : comme tu l'as vu sur notre site, Hercule reçoit et traite des dizaines de projets B2B qualifiés chaque semaine.

Notre rôle,

- c'est de sélectionner la bonne agence
- qualifier les attentes et les compétence
- établir la relation

Je fais en sorte que vous ne perdiez pas votre temps néanmoins tout ce que pourrais vous proposez sera dans la limite de vos expertises et des compétences que vous avez.

Le but simple maintenir ce niveau de qualité sur les agences qu'on recommande et sur le profil qui vous sont proposés.

La première étape formulaire calendly : ${budgetLine}

L'objectif c'est de continuer :

- profil en tant qu'agence : vos tarifs, vos succès, vos attentes.
- les demandes qui vous sont eligibles`;
}

export function buildSalesIntroChecklist(
  booking: Pick<CalendlyBookingRow, "first_name" | "name" | "questions">,
  audience: Audience = "agence",
): string[] {
  const fields = extractSalesIntroFields(booking, audience);
  const teamSize = fields.teamSize ?? "[ex. 4 à 8 collaborateurs]";
  const activities = fields.activities ?? "[ex. patrimoine, trésorerie]";

  if (isCifSalesAudience(audience)) {
    return [
      `${fields.firstName} — en ligne — Evan / Hercule CIF`,
      `Dossier Calendly — ${teamSize} — ${activities}`,
      "Hercule — demandes dirigeants qualifiées — patrimoine / trésorerie / transmission",
      "Rôle — sélection cabinet → qualifier besoin + compatibilité → relation",
      "Cadre — propositions = expertises déclarées — zéro perte de temps",
      "Déclaratif — compatibilité mandat / honoraires — pas d'invention de périmètre",
      "Objectif — qualité cabinets recommandés + mandats attribués",
      "Suite → profil cabinet (honoraires, capacité, attentes) → mandats éligibles",
    ];
  }

  if (isComptableSalesAudience(audience)) {
    return [
      `${fields.firstName} — en ligne — Evan / Hercule Comptable`,
      `Dossier Calendly — ${teamSize} — ${activities}`,
      "Hercule — demandes TPE qualifiées — reprise comptable / fiscal",
      "Rôle — sélection cabinet → qualifier besoin + compatibilité → relation",
      "Cadre — propositions = expertises déclarées — zéro perte de temps",
      "Déclaratif — compatibilité mission TPE / honoraires — pas d'invention de périmètre",
      "Objectif — qualité cabinets recommandés + missions TPE attribuées",
      "Suite → profil cabinet (honoraires, capacité, attentes) → missions éligibles",
    ];
  }

  return [
    `${fields.firstName} — en ligne — Evan / Hercule`,
    `Dossier Calendly — ${teamSize} — ${activities}`,
    "Hercule — projets B2B qualifiés — dizaines / semaine",
    "Rôle — sélection agence → qualifier attentes + compétences → relation",
    "Cadre — propositions = expertises déclarées — zéro perte de temps",
    "Brutal honesty — déclaratif OK — client éduqué — fini virement SEPA → paiement carte — inventer pour la compétition → dispute agrégateur -- mauvais moment -- chargeback",
    "Objectif — qualité agences recommandées + profils attribués",
    "Suite → profil agence (tarifs, succès, attentes) → demandes éligibles",
  ];
}
