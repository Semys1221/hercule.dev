import type { DashboardBleedContext } from "@/lib/dashboard/bleed-context";
import { interpolateDashboardCopy } from "@/lib/dashboard/onboarding-faq";

export type RecoveryDiagnosticStepId =
  | "service-fit"
  | "service-why"
  | "friction";

export type RecoveryPitchStepId = "you" | "company" | "system";

export type RecoveryStepId = RecoveryDiagnosticStepId | RecoveryPitchStepId;

export type ServiceFitAnswer = "oui" | "pas_encore";

export type RecoveryDiagnostic = {
  serviceFits: ServiceFitAnswer | null;
  serviceWhy: string;
  friction: string;
};

export type PitchFourBeats = {
  what: string;
  how: string;
  whyDifferent: string;
  benefit: string;
};

export type RecoveryPitchScreen = {
  id: RecoveryPitchStepId;
  title: string;
  beats: PitchFourBeats;
  alert?: string;
};

export const RECOVERY_DIAGNOSTIC_STEP_IDS: RecoveryDiagnosticStepId[] = [
  "service-fit",
  "service-why",
  "friction",
];

export const RECOVERY_PITCH_STEP_IDS: RecoveryPitchStepId[] = [
  "you",
  "company",
  "system",
];

export function getRecoveryStepIds(): RecoveryStepId[] {
  return [...RECOVERY_DIAGNOSTIC_STEP_IDS, ...RECOVERY_PITCH_STEP_IDS];
}

function interpolate(
  template: string,
  context?: DashboardBleedContext,
): string {
  return interpolateDashboardCopy(template, context);
}

function benefitForYou(
  diagnostic: RecoveryDiagnostic,
  context?: DashboardBleedContext,
): string {
  if (diagnostic.serviceFits === "oui") {
    return interpolate(
      "L'infrastructure s'aligne sur votre situation — {gap} devient un objectif opérationnel, pas un constat figé.",
      context,
    );
  }
  if (diagnostic.friction.trim()) {
    return interpolate(
      `Votre retour (« ${diagnostic.friction.trim()} ») est utile : nous pouvons le traiter point par point avant l'activation, avec un cadre contractuel clair.`,
      context,
    );
  }
  return interpolate(
    "Nous pouvons préciser ensemble ce qui reste à valider — le contrat encadre le déploiement et la garantie **5 000 € / 90 jours**.",
    context,
  );
}

export function buildRecoveryPitchScreens(
  diagnostic: RecoveryDiagnostic,
  context?: DashboardBleedContext,
): RecoveryPitchScreen[] {
  const goal = context?.bleed.goal?.trim();
  const goalPhrase = goal ? ` et l'objectif **${goal}**` : "";

  return [
    {
      id: "you",
      title: "Ce que vous avez déjà cadré",
      beats: {
        what: interpolate(
          "Foundation structure la croissance inbound du cabinet — pas une campagne ponctuelle.",
          context,
        ),
        how: interpolate(
          `Vous avez posé un diagnostic clair : **{cause}**, un écart de **{gap}**${goalPhrase}, et **{honoraires} €/an** d'honoraires déclarés.`,
          context,
        ),
        whyDifferent: interpolate(
          "La plupart des cabinets avancent au feeling ou via des prestataires sans garantie. Vous avez quantifié l'écart — c'est une base solide pour déployer une infrastructure.",
          context,
        ),
        benefit: benefitForYou(diagnostic, context),
      },
    },
    {
      id: "company",
      title: "Le cadre Hercule",
      beats: {
        what: interpolate(
          "Hercule construit des infrastructures d'acquisition sectorielles depuis **2018** — comptables, CIF, et autres verticales B2B.",
          context,
        ),
        how: interpolate(
          "Un système propriétaire, une équipe en France, un cadre contractuel lisible : 1 licence / zone, SLA 24 h, 0 % de commission, garantie **5 000 € / 90 jours**.",
          context,
        ),
        whyDifferent:
          "Contrairement au SEO ou à la pub (location de visibilité, délais longs, pas de garantie), Foundation installe un **actif** au nom du cabinet.",
        benefit: interpolate(
          "Vous déployez sur un cadre éprouvé — avec des règles claires des deux côtés, sur la zone **{departement}**.",
          context,
        ),
      },
    },
    {
      id: "system",
      title: "The Hercule System",
      alert: interpolate(
        "Zone **{departement}** — statut : **en cours d'attribution** (1 licence disponible).",
        context,
      ),
      beats: {
        what: interpolate(
          "**Hercule Capture** intercepte l'intention de zone · **Hercule Engine** déploie en 60 jours · **Hercule Partner** pilote avec vous.",
          context,
        ),
        how: interpolate(
          "Signaux légaux (Pappers, INSEE, BODACC) → capture brandée cabinet → demande initiée par le dirigeant. Rapports hebdo et points de pilotage.",
          context,
        ),
        whyDifferent:
          "Pas du SEO partagé — une infrastructure exclusive, avec délais et livrables contractuels.",
        benefit: interpolate(
          "Répond à **{cause}** au moment du besoin — et structure **{gap}** sur la durée, avec accountability des deux côtés.",
          context,
        ),
      },
    },
  ];
}

export function isRecoveryDiagnosticComplete(
  diagnostic: RecoveryDiagnostic,
): boolean {
  if (!diagnostic.serviceFits) {
    return false;
  }
  return (
    diagnostic.serviceWhy.trim().length >= 10 &&
    diagnostic.friction.trim().length >= 10
  );
}

export function serviceFitsToBoolean(
  answer: ServiceFitAnswer | null,
): boolean | null {
  if (answer === "oui") {
    return true;
  }
  if (answer === "pas_encore") {
    return false;
  }
  return null;
}
