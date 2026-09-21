import {
  FOUNDATION_ACTIVATION_BODY,
  FOUNDATION_ACTIVATION_CLOCKS,
  FOUNDATION_ACTIVATION_HEADLINE,
  FOUNDATION_CALENDRIER_CLOSER_COPY,
  FOUNDATION_COMPARISON_ROWS,
  FOUNDATION_DEPLOYMENT_PHASES,
  FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
  FOUNDATION_DASHBOARD_LIVE_STEP,
  FOUNDATION_FOUNDATION_BLOCKS,
  FOUNDATION_FOUNDATION_CLOSER_COPY,
  FOUNDATION_INBOUND_SLA_RULE,
  FOUNDATION_MARKETING_DEPT_BODY,
  FOUNDATION_MARKETING_DEPT_HEADLINE,
  FOUNDATION_MECHANISM_BLOCKS,
  FOUNDATION_MODEL_HIGHLIGHTS,
  FOUNDATION_ROI_ACK_LABEL,
  FOUNDATION_ROI_DISPLAY,
  formatFoundationRoiScript,
  type FoundationComparisonRow,
  type FoundationDeploymentPhase,
  type FoundationFoundationBlock,
  type FoundationMechanismBlock,
} from "@/lib/legacy/admin/funnels/comptable-sales-copy";
import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatEurosFromCents(cents: number): string {
  return `${euroFormatter.format(cents / 100)} €`;
}

/** Unités légales actives suivies (ordre de grandeur Sirene). */
export const CIF_ENTERPRISES_MONITORED_LABEL = "4 M+";

export const CIF_TYPICAL_ANNUAL_HONORAIRES_LABEL =
  COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesLabel;

export const CIF_TYPICAL_MONTHLY_HONORAIRES_CENTS =
  COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents;

export function formatCifTypicalMonthlyHonoraires(): string {
  return `${formatEurosFromCents(CIF_TYPICAL_MONTHLY_HONORAIRES_CENTS)} / mois`;
}

export type CifSignal = {
  id: string;
  label: string;
  paperwork: string;
};

/** Signaux = événements patrimoniaux / trésorerie = mandat pour un cabinet CIF/CGP. */
export const CIF_SIGNALS: CifSignal[] = [
  {
    id: "creation",
    label: "création / transmission de patrimoine",
    paperwork: "ouverture PER, clause bénéficiaire, structuration",
  },
  {
    id: "dirigeant",
    label: "cession / transmission d'entreprise",
    paperwork: "pacte Dutreil, holding, plus-value",
  },
  {
    id: "regime",
    label: "optimisation IS / IR et trésorerie d'entreprise",
    paperwork: "épargne, placement, ingénierie fiscale",
  },
  {
    id: "embauche",
    label: "besoin de cash-flow / placement de trésorerie",
    paperwork: "compte-titres, contrat de capitalisation",
  },
  {
    id: "statuts",
    label: "retraite / prévoyance du dirigeant",
    paperwork: "PER, Madelin, assurance-vie",
  },
];

/** Foundation framing — écran session CIF (pitch §6.3, transposition CIF). */
export const CIF_FOUNDATION_PRESENTATION_MIRROR_TEMPLATE =
  "Aujourd'hui : {cause} · écart {gap}. La suite dimensionne le Moteur Hercule Foundation pour cette zone — pas un stock de mandats.";

export const CIF_FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS = [
  "[Prénom], voici pourquoi on déploie le Moteur Hercule Foundation sur 60 jours. Pendant que le cabinet dépend du bouche-à-oreille, les confrères les plus agressifs ont déjà acheté du SEO et de la pub — 6 à 12 mois, zéro garantie, et le jour où ils arrêtent de payer, la visibilité s'éteint. Ce n'est pas un actif. C'est une location.",
  "Foundation n'est pas une agence SEO. Le SEO indexe des pages. Nous interceptons des événements légaux sur la zone exclusive du cabinet : cession, transmission, trésorerie, retraite. Au moment du besoin, le dirigeant voit ce cabinet et prend RDV pour une étude.",
  "Si on ne pose pas cette infrastructure maintenant, dans 6 mois le portefeuille est au même point — et la zone peut être verrouillée par un confrère. Le premier mois est du déploiement : verrou, cartographie, filtres, capture. C'est le prix d'un actif. Le contrat porte une garantie 20 RDV B2B planifiés en 3 mois. Le risque est sur notre bilan, pas sur celui du cabinet. On lance la configuration ?",
] as const;

export const CIF_FOUNDATION_SIGNALS_SUMMARY =
  "Hercule Foundation cartographie en continu les flux légaux de la zone (Pappers, INSEE Sirene, BODACC). Cinq signaux = un moment de besoin — et donc une demande d'étude possible vers ce cabinet, pas une fiche vendue à trois confrères.";

export const CIF_FOUNDATION_MECHANISM_BLOCKS: FoundationMechanismBlock[] =
  FOUNDATION_MECHANISM_BLOCKS.map((block) =>
    block.id === "inbound"
      ? {
          ...block,
          description: "RDV d'étude routé vers l'inbox / l'agenda du cabinet.",
        }
      : block,
  );

export const CIF_FOUNDATION_COMPARISON_ROWS: FoundationComparisonRow[] =
  FOUNDATION_COMPARISON_ROWS;

export const CIF_FOUNDATION_MODEL_HIGHLIGHTS = FOUNDATION_MODEL_HIGHLIGHTS;

export const CIF_FOUNDATION_DEPLOYMENT_PHASES: FoundationDeploymentPhase[] =
  FOUNDATION_DEPLOYMENT_PHASES;

export const CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES =
  FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES;

export const CIF_FOUNDATION_CALENDRIER_CLOSER_COPY = FOUNDATION_CALENDRIER_CLOSER_COPY;

export const CIF_FOUNDATION_ACTIVATION_CLOCKS = FOUNDATION_ACTIVATION_CLOCKS;
export const CIF_FOUNDATION_MARKETING_DEPT_HEADLINE = FOUNDATION_MARKETING_DEPT_HEADLINE;
export const CIF_FOUNDATION_MARKETING_DEPT_BODY = FOUNDATION_MARKETING_DEPT_BODY;
export const CIF_FOUNDATION_FOUNDATION_BLOCKS: FoundationFoundationBlock[] =
  FOUNDATION_FOUNDATION_BLOCKS;
export const CIF_FOUNDATION_FOUNDATION_CLOSER_COPY = FOUNDATION_FOUNDATION_CLOSER_COPY;
export const CIF_FOUNDATION_ACTIVATION_HEADLINE = FOUNDATION_ACTIVATION_HEADLINE;
export const CIF_FOUNDATION_ACTIVATION_BODY = FOUNDATION_ACTIVATION_BODY;
export const CIF_FOUNDATION_ROI_ACK_LABEL = FOUNDATION_ROI_ACK_LABEL;

export const CIF_FOUNDATION_ROI_DISPLAY = FOUNDATION_ROI_DISPLAY;

export { formatFoundationRoiScript as formatCifFoundationRoiScript };

export const CIF_FOUNDATION_INBOUND_SLA_RULE = FOUNDATION_INBOUND_SLA_RULE.replace(
  "audit / RDV conseil",
  "RDV d'étude / conseil",
);

export const CIF_FOUNDATION_DASHBOARD_LIVE_STEP = FOUNDATION_DASHBOARD_LIVE_STEP;

/** @deprecated Legacy — use CIF Foundation exports for session presentation. */
export const CIF_PRESENTATION_PARAGRAPHS = [
  CIF_FOUNDATION_SIGNALS_SUMMARY,
  `Cinq signaux produisent un mandat de conseil patrimonial, fiscal ou trésorerie : ${CIF_SIGNALS.map((signal) => signal.label).join(", ")}.`,
] as const;

/** @deprecated Use CIF_FOUNDATION_MODEL_HIGHLIGHTS in session presentation. */
export const CIF_MODEL_HIGHLIGHTS = CIF_FOUNDATION_MODEL_HIGHLIGHTS;

export const CIF_Q21_PROMPT =
  "La plupart des dirigeants {clientSegment} ont déjà une banque privée ou un CGP. Sur quels points votre cabinet est-il réellement meilleur qu'un interlocuteur déjà en place ?";

export const CIF_Q21_DESCRIPTION =
  "Sélectionnez jusqu'à 3 réponses. C'est ce que le dirigeant entendra en RDV — pas un argument prix.";

export const CIF_DIFFERENTIATOR_OPTIONS = [
  {
    id: "architecture_ouverte",
    label: "Architecture ouverte — pas de contrat lié à un seul assureur ou banque",
    helpTitle: "Architecture ouverte",
    helpText:
      "Le dirigeant compare les solutions du marché, pas un catalogue captif d'un réseau.",
  },
  {
    id: "acces_associe",
    label: "Accès direct à un associé ou conseiller senior (réponse sous 48 h)",
    helpTitle: "Accès direct",
    helpText:
      "Motif n°1 de changement : interlocuteur injoignable ou junior sans décision.",
  },
  {
    id: "reporting_patrimonial",
    label: "Reporting patrimonial consolidé (encours, liquidités, objectifs)",
    helpTitle: "Reporting",
    helpText:
      "Vision globale patrimoine + trésorerie d'entreprise, pas seulement un relevé produit.",
  },
  {
    id: "remuneration_lisible",
    label: "Rémunération lisible — honoraires et commissions explicités dans le mandat",
    helpTitle: "Transparence",
    helpText:
      "Pas de frais cachés ni de produits imposés sans lien avec l'objectif du dirigeant.",
  },
  {
    id: "specialisation_dirigeant",
    label: "Spécialisation dirigeant / trésorerie d'entreprise (pas seulement épargne personnelle)",
  },
  {
    id: "transmission",
    label: "Ingénierie transmission — Dutreil, holding, cession structurée",
    helpTitle: "Transmission",
    helpText:
      "Accompagnement structuré sur la cession ou la transmission, pas un simple arbitrage produit.",
  },
  {
    id: "secteur",
    label: "Spécialisation sectorielle (dirigeants BTP, professions libérales, e-commerce…)",
  },
] as const;

export const CIF_PERFORMANCE_REPORTING_RULE = {
  title: "Reporting des performances",
  description:
    "Signaler l'issue de chaque RDV dirigeant {clientSegment} (honoré, no-show, mandat signé, refus) pour le même suivi que les autres niches Hercule.",
} as const;

export const CIF_PERFORMANCE_REPORTING_INTRO =
  "Hercule suit déjà ces taux sur les développeurs, designers, SEO et conseillers financiers. Le reporting CIF s'aligne sur le même cadre.";

export const CIF_NICHE_BENCHMARK = {
  disadvantages: {
    title: "Contraintes de la niche",
    items: [
      "Concurrence forte des banques privées et réseaux — le dirigeant compare avant de changer.",
      `Honoraires modérés : ~${formatCifTypicalMonthlyHonoraires()} de conseil dirigeant (${CIF_TYPICAL_ANNUAL_HONORAIRES_LABEL} / an).`,
      "Cycle de décision plus long qu'une obligation comptable — le mandat se construit en RDV.",
    ],
  },
  advantages: {
    title: "Atouts — pourquoi le mandat se signe",
    items: [
      "Signaux patrimoniaux concrets (cession, trésorerie, transmission) — le dirigeant arrive avec un besoin identifié.",
      "Besoin réel de structuration (Dutreil, holding, retraite) — pas un achat d'image comme une identité visuelle.",
      "Peu de conviction préalable à construire sur l'utilité du conseil : l'enjeu du RDV est le changement d'interlocuteur, pas la justification du recours à un CIF.",
    ],
  },
} as const;
