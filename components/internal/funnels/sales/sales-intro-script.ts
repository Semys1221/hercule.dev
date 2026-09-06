import type { CalendlyBookingRow } from "@/lib/calendly/list-bookings";

export const SALES_DECLARATIVE_SCRIPT = `Toutes les questions restent du déclaratif : aujourd'hui je vais vous poser des questions, ce n'est pas une compétition, ni le but est de s'inventer des services. C'est du déclaratif certes, mais aujourd'hui si je vous attribue une agence en recherche d'un service de création web et que vous lui faites des réseaux sociaux c'est vous qui allez avoir un chargeback et un très mauvais retour client.

Et soyons honnêtes deux minutes : **on n'est plus en 2010 aujourd'hui. Le client est éduqué.** Plus personne ne fait de virement SEPA classique avec un petit libellé à l'ancienne. Tout passe par des agrégateurs de paiement comme Stripe. Et vous savez comment ça se passe : dès que vous accumulez trop de disputes et de clients mécontents, **c'est un aller simple pour vous faire bloquer vos comptes et fermer boutique. nous on garde le contact aussi avec ces clients** donc on ne pourra plus travailler ensemble.

Chez Hercule, on protège nos clients et on protège nos agences. On valide la compatibilité à 100 % pour que vous encaissiez vos projets sereinement. On joue cartes sur table. Ça vous va ?`;

export type SalesIntroScriptFields = {
  firstName: string;
  teamSize: string | null;
  activities: string | null;
  budgetConfirmed: boolean;
};

const TEAM_SIZE_KEYS = ["salarié", "salariés", "équipe", "equipe", "taille", "collaborateur"];
const ACTIVITY_KEYS = [
  "activité",
  "activite",
  "spécialité",
  "specialite",
  "expertise",
  "positionnement",
  "compétence",
  "competence",
];
const BUDGET_KEYS = ["budget", "tarif", "prix", "1500", "1 500", "produit d'appel"];

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

export function extractSalesIntroFields(
  booking: Pick<CalendlyBookingRow, "first_name" | "name" | "questions">,
): SalesIntroScriptFields {
  const firstName =
    booking.first_name?.trim() ||
    booking.name.trim().split(/\s+/)[0] ||
    "Prospect";

  const teamSize = matchQuestionAnswer(booking.questions, TEAM_SIZE_KEYS);
  const activities = matchQuestionAnswer(booking.questions, ACTIVITY_KEYS);

  const budgetAnswer = matchQuestionAnswer(booking.questions, BUDGET_KEYS);
  const budgetConfirmed =
    Boolean(budgetAnswer) &&
    /1[\s.]?500|1500|plus de/i.test(budgetAnswer ?? "");

  return {
    firstName,
    teamSize,
    activities,
    budgetConfirmed,
  };
}

export function buildSalesIntroScript(
  booking: Pick<CalendlyBookingRow, "first_name" | "name" | "questions">,
): string {
  const fields = extractSalesIntroFields(booking);
  const teamSize = fields.teamSize ?? "[Nombre de salariés, ex: 2 à 5]";
  const activities =
    fields.activities ?? "[Champs d'activité, ex: le Trafic Payant et le Dev Front-end]";

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
