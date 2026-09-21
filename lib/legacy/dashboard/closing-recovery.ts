import type { DashboardBleedContext } from "@/lib/legacy/dashboard/bleed-context";
import { interpolateDashboardCopy } from "@/lib/legacy/dashboard/onboarding-faq";

export type RecoveryDiagnosticStepId =
  | "service-fit"
  | "service-why"
  | "friction";

export type RecoveryPitchStepId = "you" | "company" | "system";

export type RecoveryStepId = RecoveryDiagnosticStepId | RecoveryPitchStepId;

export type RecoveryPitchAngle = 1 | 2;

export type ServiceFitAnswer = "oui" | "pas_encore";

export const RECOVERY_MAX_CYCLES = 2;

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

export function getRecoveryAngle(recoveryCycle: number): RecoveryPitchAngle {
  return recoveryCycle >= 1 ? 2 : 1;
}

function interpolate(
  template: string,
  context?: DashboardBleedContext,
): string {
  return interpolateDashboardCopy(template, context);
}

function benefitForYouAngle1(
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

function benefitForYouAngle2(
  diagnostic: RecoveryDiagnostic,
  context?: DashboardBleedContext,
): string {
  const friction = diagnostic.friction.trim();
  if (friction) {
    return interpolate(
      `Chaque semaine sans infrastructure, **{cause}** continue de peser sur **{gap}**. Votre frein (« ${friction} ») est traité contractuellement — pas laissé au hasard.`,
      context,
    );
  }
  return interpolate(
    "Sans verrou zone, l'écart **{gap}** reste un constat. L'activation transforme le diagnostic en plan opérationnel — avec garantie **5 000 € / 90 jours**.",
    context,
  );
}

function buildAngle1Screens(
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
        benefit: benefitForYouAngle1(diagnostic, context),
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
      title: "Le système Hercule",
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

function buildAngle2Screens(
  diagnostic: RecoveryDiagnostic,
  context?: DashboardBleedContext,
): RecoveryPitchScreen[] {
  const serviceWhy = diagnostic.serviceWhy.trim();
  const friction = diagnostic.friction.trim();
  const whyEcho = serviceWhy
    ? `Vous avez indiqué : « ${serviceWhy} ».`
    : "Votre retour guide le dernier angle avant activation.";

  return [
    {
      id: "you",
      title: "Le coût de l'attente",
      beats: {
        what: interpolate(
          "**{cause}** n'attend pas : chaque trimestre sans infrastructure, l'écart **{gap}** se creuse.",
          context,
        ),
        how: interpolate(
          `Honoraires déclarés **{honoraires} €/an** — l'écart est quantifié. ${whyEcho}`,
          context,
        ),
        whyDifferent: interpolate(
          "Un cabinet qui reporte sans cadre contractuel reporte aussi la garantie **5 000 € / 90 jours** et le verrou zone.",
          context,
        ),
        benefit: benefitForYouAngle2(diagnostic, context),
      },
    },
    {
      id: "company",
      title: "Pourquoi maintenant",
      beats: {
        what: interpolate(
          "Foundation n'est pas une campagne test — c'est un déploiement sur **{departement}** avec livrables à 60 jours.",
          context,
        ),
        how: interpolate(
          friction
            ? `Le point que vous avez soulevé (« ${friction} ») est prévu dans le cadre : SLA 24 h, 0 % commission, garantie contractuelle.`
            : "SLA 24 h, 0 % commission, garantie **5 000 € / 90 jours** — le cadre encadre le déploiement des deux côtés.",
          context,
        ),
        whyDifferent:
          "Le SEO et la pub louent de la visibilité partagée. Foundation installe un actif exclusif au nom du cabinet.",
        benefit: interpolate(
          "L'objectif n'est pas de « tester » — c'est de traiter **{cause}** avec un système live et mesurable sur la zone.",
          context,
        ),
      },
    },
    {
      id: "system",
      title: "Urgence zone",
      alert: interpolate(
        "Statut zone **{departement}** : **en cours d'attribution** — **1 seule licence** disponible.",
        context,
      ),
      beats: {
        what: interpolate(
          "**Un cabinet par zone** — bande passante limitée sur les flux légaux (Pappers, INSEE, BODACC).",
          context,
        ),
        how: interpolate(
          "D'autres cabinets sont en audit sur ce secteur cette semaine. Une activation pose le verrou **12 mois** — la file se ferme pour les concurrents.",
          context,
        ),
        whyDifferent:
          "Sans verrou, la zone peut être attribuée à un autre cabinet — ou à une agence SEO sans garantie.",
        benefit: interpolate(
          "{prenom}, l'infrastructure répond à **{cause}** au moment du besoin et structure **{gap}** — tant que la zone est encore disponible.",
          context,
        ),
      },
    },
  ];
}

export function buildRecoveryPitchScreens(
  diagnostic: RecoveryDiagnostic,
  context?: DashboardBleedContext,
  angle: RecoveryPitchAngle = 1,
): RecoveryPitchScreen[] {
  if (angle === 2) {
    return buildAngle2Screens(diagnostic, context);
  }
  return buildAngle1Screens(diagnostic, context);
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
