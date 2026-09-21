import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";

const euroFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatEurosFromCents(cents: number): string {
  return `${euroFormatter.format(cents / 100)} €`;
}

/** Unités légales actives suivies (ordre de grandeur Sirene). */
export const COMPTABLE_ENTERPRISES_MONITORED_LABEL = "4 M+";

export const COMPTABLE_TYPICAL_ANNUAL_HONORAIRES_LABEL =
  COMMERCIAL_COMPTABLE.valueShowcaseAnnualHonorairesLabel;

export const COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS =
  COMMERCIAL_COMPTABLE.mrrPerSignedMissionCents;

export function formatComptableTypicalMonthlyHonoraires(): string {
  return `${formatEurosFromCents(COMPTABLE_TYPICAL_MONTHLY_HONORAIRES_CENTS)} / mois`;
}

export type ComptableSignal = {
  id: string;
  label: string;
  paperwork: string;
};

/** Signaux = formalités / obligations = dossier pour un cabinet. */
export const COMPTABLE_SIGNALS: ComptableSignal[] = [
  {
    id: "creation",
    label: "création / immatriculation Sirene",
    paperwork: "première lettre de mission, choix du régime, immatriculation",
  },
  {
    id: "dirigeant",
    label: "changement de dirigeant",
    paperwork: "PV, formalités greffe, souvent une nouvelle lettre de mission",
  },
  {
    id: "regime",
    label: "sortie de micro / assujettissement TVA / passage au réel",
    paperwork: "tenue, liasse, déclarations de TVA",
  },
  {
    id: "embauche",
    label: "première embauche ou franchissement du seuil de 11 salariés",
    paperwork: "DPAE, DSN, paie, DUE",
  },
  {
    id: "statuts",
    label: "modification statutaire (siège, objet, capital, cession de parts)",
    paperwork: "formalités greffe et impacts fiscaux",
  },
];

/** Foundation framing — écran session comptable (pitch §6.3). */
export const FOUNDATION_PRESENTATION_MIRROR_TEMPLATE =
  "Aujourd'hui : {cause} · écart {gap}. La suite dimensionne le Moteur Hercule Foundation pour cette zone — pas un stock de dossiers.";

export const FOUNDATION_PRESENTATION_SCRIPT_PARAGRAPHS = [
  "[Prénom], voici pourquoi on déploie le Moteur Hercule Foundation sur 60 jours. Pendant que le cabinet dépend du bouche-à-oreille, les confrères les plus agressifs ont déjà acheté du SEO et de la pub — 6 à 12 mois, zéro garantie, et le jour où ils arrêtent de payer, la visibilité s'éteint. Ce n'est pas un actif. C'est une location.",
  "Foundation n'est pas une agence SEO. Le SEO indexe des pages. Nous interceptons des événements légaux sur la zone exclusive du cabinet : création, changement de régime, dirigeant, embauche. Au moment du besoin, la TPE voit ce cabinet et prend contact.",
  "Si on ne pose pas cette infrastructure maintenant, dans 6 mois le portefeuille est au même point — et la zone peut être verrouillée par un confrère. Le premier mois est du déploiement : verrou, cartographie, filtres, capture. C'est le prix d'un actif. Le contrat porte une garantie 20 RDV B2B planifiés en 3 mois. Le risque est sur notre bilan, pas sur celui du cabinet. On lance la configuration ?",
] as const;

export const FOUNDATION_SIGNALS_SUMMARY =
  "Hercule Foundation cartographie en continu les flux légaux de la zone (Pappers, INSEE Sirene, BODACC). Cinq signaux = un moment de besoin — et donc une demande d'audit possible vers ce cabinet, pas une fiche vendue à trois confrères.";

export type FoundationMechanismBlock = {
  id: string;
  title: string;
  description: string;
};

export const FOUNDATION_MECHANISM_BLOCKS: FoundationMechanismBlock[] = [
  {
    id: "signals",
    title: "Flux légaux de zone",
    description: "INSEE, BODACC, Pappers — événements sur la zone exclusive du cabinet.",
  },
  {
    id: "map",
    title: "Cartographie exclusive",
    description: "Verrou 1 cabinet / zone · filtres cabinet · signaux qualifiés.",
  },
  {
    id: "capture",
    title: "Capture au nom du cabinet",
    description: "Identité, landing et tracking brandés cabinet — pas un apporteur.",
  },
  {
    id: "inbound",
    title: "Le dirigeant initie",
    description: "Demande d'audit routée vers l'inbox / l'agenda du cabinet.",
  },
];

export type FoundationComparisonRow = {
  criterion: string;
  seo: string;
  foundation: string;
};

export const FOUNDATION_COMPARISON_ROWS: FoundationComparisonRow[] = [
  { criterion: "Mécanisme", seo: "Google, enchères, contenu", foundation: "Événement légal de zone" },
  { criterion: "Délai", seo: "6–12 mois, souvent sans preuve", foundation: "60 jours pour un système live" },
  {
    criterion: "Actif",
    seo: "Locataire : ça s'arrête avec la facture",
    foundation: "Infrastructure exclusive, au nom du cabinet",
  },
  { criterion: "Qui contacte", seo: "Le cabinet chasse", foundation: "Le dirigeant initie" },
  {
    criterion: "Exclusivité",
    seo: "N'importe quel confrère achète les mêmes mots-clés",
    foundation: "1 cabinet / zone",
  },
  {
    criterion: "Garantie",
    seo: "Trafic, parfois rien",
    foundation: "20 RDV B2B garantis (3 mois)",
  },
];

export const FOUNDATION_MODEL_HIGHLIGHTS = [
  {
    title: "20 RDV",
    description:
      "B2B planifiés garantis en 3 mois — dirigeants qualifiés, pas un volume de sollicitations.",
  },
  {
    title: COMPTABLE_ENTERPRISES_MONITORED_LABEL,
    description: "d'unités légales suivies — cartographie de zone, pas une liste achetée.",
  },
  {
    title: "0 %",
    description: "de commission sur les honoraires.",
  },
] as const;

export type FoundationDeploymentPhase = {
  id: string;
  window: string;
  title: string;
  artifacts: string[];
};

export const FOUNDATION_DEPLOYMENT_PHASES: FoundationDeploymentPhase[] = [
  {
    id: "phase-1",
    window: "J+1 → J+20",
    title: "Verrouillage & cartographie",
    artifacts: [
      "Verrou 1 cabinet / zone (carte)",
      "Cartographie des flux légaux",
      "Filtres cabinet",
      "Capture brandée cabinet (identité / landing / tracking)",
    ],
  },
  {
    id: "phase-2",
    window: "J+21 → J+45",
    title: "Capture & calibrage",
    artifacts: [
      "Tests de friction",
      "Montée en charge du ciblage",
      "Rapport hebdo « ce qui a été raccordé » (pas de volume promis)",
    ],
  },
  {
    id: "phase-3",
    window: "J+46 → J+60",
    title: "Activation — système live",
    artifacts: [
      "Capture allumée",
      "Demandes qui routent vers inbox / agenda du cabinet",
    ],
  },
];

export const FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES = [
  "Semaine 1 — verrou de zone posé, cartographie lancée",
  "Semaine 2 — filtres cabinet calibrés sur la zone",
  "Semaine 3 — capture brandée raccordée (identité / landing)",
  "Semaine 4 — tests de friction sur le parcours dirigeant",
  "Semaine 5 — montée en charge du ciblage",
  "Semaine 6 — rapport hebdo : signaux raccordés à la capture",
] as const;

export const FOUNDATION_CALENDRIER_CLOSER_COPY =
  "Le calendrier correspond au déploiement Foundation sur la zone du cabinet, pas à une file de leads. À J+60 le système est opérationnel. Une demande antérieure reste possible, sans engagement affiché à l'écran.";

export const FOUNDATION_ACTIVATION_CLOCKS = [
  {
    id: "deploy",
    label: "Déploiement",
    duration: "60 jours",
    message: "Système live à J+60 — aucun premier RDV promis à l'écran.",
  },
  {
    id: "guarantee",
    label: "Garantie",
    duration: "90 jours",
    message: "Checkpoint RDV dès l'activation — 20 RDV B2B planifiés en 3 mois.",
  },
] as const;

export const FOUNDATION_MARKETING_DEPT_HEADLINE =
  "Les deux premiers mois — construction du département marketing du cabinet";

export const FOUNDATION_MARKETING_DEPT_BODY =
  "Pendant les 60 premiers jours, on ne promet pas encore de volume. On installe les fondations : verrou de zone, identité, landing, capture brandée et cartographie des flux légaux. C'est le département marketing que le cabinet n'a pas eu le temps de construire — pas une campagne opaque.";

export type FoundationFoundationBlock = {
  id: string;
  month: string;
  title: string;
  items: string[];
};

export const FOUNDATION_FOUNDATION_BLOCKS: FoundationFoundationBlock[] = [
  {
    id: "month-1",
    month: "Mois 1",
    title: "Verrouillage & cartographie",
    items: [
      "Verrou 1 cabinet / zone",
      "Cartographie des flux légaux",
      "Filtres cabinet",
      "Capture brandée (identité / landing / tracking)",
    ],
  },
  {
    id: "month-2",
    month: "Mois 2",
    title: "Capture & calibrage",
    items: [
      "Tests de friction sur le parcours dirigeant",
      "Montée en charge du ciblage",
      "Rapport hebdo « ce qui a été raccordé »",
    ],
  },
];

export const FOUNDATION_FOUNDATION_CLOSER_COPY =
  "Pour traiter {cause}, ces fondations sont nécessaires : sans elles, toute acquisition reste de la location. SEO, publicité, apporteurs — le cabinet paie sans construire d'actif.";

export const FOUNDATION_ACTIVATION_HEADLINE = "Mois 3 — système live";

export const FOUNDATION_ACTIVATION_BODY =
  "À J+46 → J+60, la capture s'allume et les demandes routent vers l'inbox / l'agenda du cabinet. La fenêtre garantie 90 jours démarre à l'activation — le checkpoint MRR vient après le déploiement, pas avant.";

export const FOUNDATION_ROI_ACK_LABEL =
  "Le cabinet valide le bénéfice contractuel (20 RDV B2B garantis en 3 mois, valeur année 1).";

export const FOUNDATION_ROI_DISPLAY = {
  guaranteeRdvCount: 20,
  guaranteeWindowMonths: 3,
  yearOneValueEur: 60_000,
} as const;

export const FOUNDATION_ROI_SCRIPT_TEMPLATE =
  "Honoraires déclarés : {honoraires} €/an. Le contrat garantit 20 RDV B2B en 3 mois — 60 000 € de valeur dès l'année 1. Ne pas signer, c'est laisser {cause} ouvert et la zone disponible.";

export function formatFoundationRoiScript(honorairesEur: number, cause: string): string {
  const honorairesLabel = euroFormatter.format(honorairesEur);
  return FOUNDATION_ROI_SCRIPT_TEMPLATE
    .replace(/\{honoraires\}/g, honorairesLabel)
    .replace(/\{cause\}/g, cause || "l'écart déclaré");
}

export const FOUNDATION_INBOUND_SLA_RULE =
  "Ces règles ne constituent pas une affiliation. Toute demande inbound (audit / RDV conseil) reçue par le cabinet doit être traitée sous 24 h. À défaut, la capture de zone est réorientée vers un confrère et la garantie est suspendue. Engagement mutuel sur ce cadre.";

export const FOUNDATION_DASHBOARD_LIVE_STEP = "Système live — J+60 après activation";

/** @deprecated Legacy paragraphs — use Foundation exports for session presentation. */
export const COMPTABLE_PRESENTATION_PARAGRAPHS = [
  FOUNDATION_SIGNALS_SUMMARY,
  `Cinq signaux produisent du papier — et donc un dossier de tenue, de social ou de formalités : ${COMPTABLE_SIGNALS.map((signal) => signal.label).join(", ")}.`,
] as const;

/** @deprecated Use FOUNDATION_MODEL_HIGHLIGHTS in session presentation. */
export const COMPTABLE_MODEL_HIGHLIGHTS = FOUNDATION_MODEL_HIGHLIGHTS;

export const COMPTABLE_Q21_PROMPT =
  "La plupart des dirigeants {clientSegment} ont déjà un expert-comptable. Sur quels points votre cabinet est-il réellement meilleur qu'un cabinet déjà en place ?";

export const COMPTABLE_Q21_DESCRIPTION =
  "Sélectionnez jusqu'à 3 réponses. C'est ce que le dirigeant entendra en RDV — pas un argument prix.";

export const COMPTABLE_DIFFERENTIATOR_OPTIONS = [
  {
    id: "reactivite",
    label: "Accès direct au collaborateur (réponse sous 48 h, y compris hors clôture)",
    helpTitle: "Réactivité",
    helpText:
      "Le motif n°1 de changement de cabinet : un collaborateur injoignable hors période fiscale.",
  },
  {
    id: "outils",
    label: "Espace client / flux de pièces (Pennylane, ACD, etc.) plutôt que le carton à J-15",
    helpTitle: "Outils",
    helpText:
      "Pièces justificatives en flux continu, pas un carton déposé à la clôture.",
  },
  {
    id: "pilotage",
    label: "Tableaux de bord, TVA, trésorerie — pas seulement la liasse",
  },
  {
    id: "social_integre",
    label: "Paie / DSN dans la même lettre, un seul interlocuteur",
  },
  {
    id: "formalites",
    label: "Création et modifications (statuts, siège, capital) sans tout renvoyer chez l'avocat",
    helpTitle: "Formalités",
    helpText:
      "Formalités courantes (statuts, siège, capital). Les dossiers contentieux restent chez l'avocat.",
  },
  {
    id: "honoraires_lisibles",
    label: "Lettre de mission claire, pas de régularisation surprise en N+1",
  },
  {
    id: "secteur",
    label: "Spécialisation sectorielle (e-com, BNC, artisanat…)",
  },
] as const;

export const COMPTABLE_PERFORMANCE_REPORTING_RULE = {
  title: "Reporting des performances",
  description:
    "Signaler l'issue de chaque RDV dirigeant {clientSegment} (honoré, no-show, lettre signée, refus) pour le même suivi que les autres niches Hercule.",
} as const;

export const COMPTABLE_PERFORMANCE_REPORTING_INTRO =
  "Hercule suit déjà ces taux sur les développeurs, designers, SEO et conseillers financiers. Le reporting comptable s'aligne sur le même cadre.";

export const COMPTABLE_NICHE_BENCHMARK = {
  disadvantages: {
    title: "Contraintes de la niche",
    items: [
      "Service perçu comme interchangeable : faible projection aspirationnelle en vente.",
      `Honoraires modérés : ~${formatComptableTypicalMonthlyHonoraires()} de tenue TPE (${COMPTABLE_TYPICAL_ANNUAL_HONORAIRES_LABEL} / an).`,
      "Moins de marge argumentaire qu'en designer ou en SEO.",
    ],
  },
  advantages: {
    title: "Atouts — pourquoi la lettre se signe",
    items: [
      "Niche à la conversion la plus directe chez Hercule : démarche administrative plutôt que vente relationnelle.",
      "Besoin réglementaire avéré (comptabilité, TVA, paie) — pas un achat d'image comme une identité visuelle.",
      "Peu de conviction préalable à construire : le dirigeant considère l'expertise comme une obligation légale. L'enjeu du RDV est le changement de cabinet, pas la justification du recours à un expert-comptable.",
    ],
  },
} as const;
