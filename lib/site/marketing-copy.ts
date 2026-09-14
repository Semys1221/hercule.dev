export type MarketingAudience = "comptable" | "cif" | "agence";

export const MARKETING_PRIMARY_CTA = "Acquérir le système Hercule";
export const MARKETING_SECONDARY_CTA = "Voir le pipeline";
export const MARKETING_AUDIT_CTA = "Réserver un audit système";
export const MARKETING_NAV_PIPELINE = "Pipeline";

export const MARKETING_FOOTER_TAGLINE =
  "Système inbound exclusif pour cabinets et agences partenaires.";

type HeroCopy = {
  title: string;
  subtitle: string;
};

type PilierCopy = {
  headline: string;
  intro: string;
  cards: { title: string; description: string }[];
};

type BandeProjetsCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: string;
  disclaimer: string;
};

type AuditLiveCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  panelTitle: string;
  panelSubtitle: string;
  successLabel: string;
};

type MethodeRadarCopy = {
  title: string;
  sectionTitle: string;
  sectionBody: string;
};

type BandeAuditCopy = {
  eyebrow: string;
  title: string;
  intro: string;
};

type BandeStackCopy = {
  text: string;
};

type GrillePipelineCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  demandesLabel: string;
  signauxLabel: string;
};

type ApercuCrmCopy = {
  searchPlaceholder: string;
  navFluxRouted: string;
  timelineAssigned: string;
  timelineCurrent: string;
};

export type MarketingAudienceCopy = {
  hero: HeroCopy;
  pilier: PilierCopy;
  bandeProjets: BandeProjetsCopy;
  auditLive: AuditLiveCopy;
  methodeRadar: MethodeRadarCopy;
  bandeAudit: BandeAuditCopy;
  bandeStack: BandeStackCopy;
  grillePipeline: GrillePipelineCopy;
  apercuCrm: ApercuCrmCopy;
};

const COMPTABLE_COPY: MarketingAudienceCopy = {
  hero: {
    title: "Déployez le système inbound Hercule sur votre zone.",
    subtitle:
      "Infrastructure exclusive de capture, qualification et routage — live en 60 jours. Pas un apporteur, pas une file de leads.",
  },
  pilier: {
    headline: "Un système inbound, pas une marketplace de dossiers.",
    intro:
      "Hercule installe une infrastructure de capture brandée sur votre zone. Chaque flux qualifié est routé en exclusivité vers votre cabinet.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 cabinet / zone. Les signaux légaux de votre territoire alimentent votre pipeline — pas celui d'un confrère.",
        },
      },
      {
        title: "Capture brandée",
        description:
          "Identité, landing et tracking au nom du cabinet. Le dirigeant initie le contact — vous ne chassez pas.",
        },
      },
      {
        title: "Déploiement 60 jours",
        description:
          "Cartographie, filtres cabinet et mise en production du système. Aucun premier RDV promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    eyebrow: "Pipeline",
    title: "Flux qualifiés routés par le système",
    subtitle: "Aperçus illustratifs — chaque flux est confié en exclusivité à un cabinet partenaire.",
    intro:
      "Le système Hercule qualifie les besoins des dirigeants PME et route chaque demande vers le cabinet compatible.",
    disclaimer:
      "Ces exemples illustrent le pipeline du système. Chaque flux est routé en exclusivité vers un partenaire de zone. Les détails complets sont présentés lors de l'audit système.",
  },
  auditLive: {
    eyebrow: "Système en direct",
    title: "Découvrez le pipeline lors de l'audit système.",
    intro:
      "Lors de l'échange, nous démontrons le fonctionnement du système sur votre zone et vérifions la compatibilité de votre cabinet.",
    panelTitle: "Pipeline système · Audit en cours",
    panelSubtitle: "Tenue comptable · Zone Bordeaux",
    successLabel: "Compatibilité confirmée — flux routé",
  },
  methodeRadar: {
    title: "Acquisition continue des signaux de zone",
    sectionTitle: "Comment le système capte les signaux",
    sectionBody:
      "Hercule détecte en continu les signaux d'intention : créations d'activité, changements d'expert-comptable, échéances fiscales et autres indicateurs. Ces dirigeants sont qualifiés puis routés vers le cabinet le plus adapté.",
  },
  bandeAudit: {
    eyebrow: "Infrastructure inbound exclusive — déployée sur votre zone",
    title: "Réservez votre audit système",
    intro:
      "Vérifions ensemble si le système Hercule peut être déployé sur votre zone et si votre cabinet a la bande passante pour l'absorber.",
  },
  bandeStack: {
    text: "Des cabinets partenaires déploient le système Hercule sur leur zone.",
  },
  grillePipeline: {
    eyebrow: "Pipeline",
    title: "Signaux capturés et flux qualifiés en continu",
    intro:
      "Hercule surveille les formalités Sirene et Pappers, capte les signaux d'intention en temps réel, puis qualifie chaque dirigeant PME avant de router le flux vers le cabinet compatible.",
    demandesLabel: "Flux récemment routés",
    signauxLabel: "Signaux capturés",
  },
  apercuCrm: {
    searchPlaceholder: "Rechercher un flux…",
    navFluxRouted: "Flux routés",
    timelineAssigned: "Flux routé",
    timelineCurrent: "Flux routé",
  },
};

const CIF_COPY: MarketingAudienceCopy = {
  ...COMPTABLE_COPY,
  hero: {
    title: "Déployez le système inbound Hercule sur votre zone.",
    subtitle:
      "Infrastructure exclusive de capture patrimoniale, qualification et routage — live en 60 jours. Pas un apporteur, pas une file de leads.",
  },
  pilier: {
    ...COMPTABLE_COPY.pilier,
    intro:
      "Hercule installe une infrastructure de capture brandée sur votre zone. Chaque flux patrimonial qualifié est routé en exclusivité vers votre cabinet CIF.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 cabinet / zone. Les signaux patrimoniaux de votre territoire alimentent votre pipeline — pas celui d'un confrère.",
      },
      {
        title: "Capture brandée",
        description:
          "Identité, landing et tracking au nom du cabinet. Le dirigeant initie le contact — vous ne chassez pas.",
      },
      {
        title: "Déploiement 60 jours",
        description:
          "Cartographie, filtres cabinet et mise en production du système. Aucun premier RDV promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    ...COMPTABLE_COPY.bandeProjets,
    intro:
      "Le système Hercule qualifie les besoins des dirigeants PME et route chaque demande vers le cabinet CIF compatible.",
  },
  auditLive: {
    ...COMPTABLE_COPY.auditLive,
    panelSubtitle: "Optimisation fiscale · Zone Lyon",
  },
  methodeRadar: {
    ...COMPTABLE_COPY.methodeRadar,
    sectionBody:
      "Hercule détecte en continu les signaux patrimoniaux : transmission, trésorerie, retraite et autres indicateurs. Ces dirigeants sont qualifiés puis routés vers le cabinet le plus adapté.",
  },
  grillePipeline: {
    ...COMPTABLE_COPY.grillePipeline,
    intro:
      "Hercule surveille les formalités Sirene et Pappers, capte les signaux patrimoniaux en temps réel, puis qualifie chaque dirigeant PME avant de router le flux vers le cabinet compatible.",
  },
};

const AGENCE_COPY: MarketingAudienceCopy = {
  hero: {
    title: "Déployez le système inbound Hercule pour votre agence.",
    subtitle:
      "Infrastructure exclusive de capture, qualification et routage B2B — live en 60 jours. Pas un apporteur, pas une marketplace de projets.",
  },
  pilier: {
    headline: "Un système inbound, pas une marketplace de projets.",
    intro:
      "Hercule installe une infrastructure de capture brandée pour votre agence. Chaque demande qualifiée est routée en exclusivité vers votre équipe.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 agence / zone. Les signaux B2B de votre territoire alimentent votre pipeline — pas celui d'une concurrente.",
      },
      {
        title: "Capture brandée",
        description:
          "Identité, landing et tracking au nom de l'agence. Le dirigeant initie le contact — vous ne prospectez pas à froid.",
      },
      {
        title: "Déploiement 60 jours",
        description:
          "Cartographie, filtres agence et mise en production du système. Aucun premier RDV promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    eyebrow: "Pipeline",
    title: "Flux qualifiés routés par le système",
    subtitle: "Aperçus illustratifs — chaque demande est confiée en exclusivité à une agence partenaire.",
    intro:
      "Le système Hercule qualifie les besoins des entreprises et route chaque demande vers l'agence compatible.",
    disclaimer:
      "Ces exemples illustrent le pipeline du système. Chaque flux est routé en exclusivité vers un partenaire de zone. Les détails complets sont présentés lors de l'audit système.",
  },
  auditLive: {
    eyebrow: "Système en direct",
    title: "Découvrez le pipeline lors de l'audit système.",
    intro:
      "Lors de l'échange, nous démontrons le fonctionnement du système sur votre zone et vérifions la compatibilité de votre agence.",
    panelTitle: "Pipeline système · Audit en cours",
    panelSubtitle: "Refonte e-commerce · Budget 12 000 €",
    successLabel: "Compatibilité confirmée — flux routé",
  },
  methodeRadar: {
    title: "Acquisition continue des signaux B2B",
    sectionTitle: "Comment le système capte les signaux",
    sectionBody:
      "Hercule détecte en continu les signaux d'intention B2B : créations d'activité, changements de prestataire, levées de fonds et autres indicateurs. Ces dirigeants sont qualifiés puis routés vers l'agence la plus adaptée.",
  },
  bandeAudit: {
    eyebrow: "Infrastructure inbound exclusive — déployée pour votre agence",
    title: "Réservez votre audit système",
    intro:
      "Vérifions ensemble si le système Hercule peut être déployé pour votre agence et si votre équipe a la bande passante pour l'absorber.",
  },
  bandeStack: {
    text: "Des agences partenaires déploient le système Hercule sur leur zone.",
  },
  grillePipeline: {
    eyebrow: "Pipeline",
    title: "Signaux capturés et flux qualifiés en continu",
    intro:
      "Hercule capte les signaux d'intention B2B en temps réel, puis qualifie chaque dirigeant avant de router le flux vers l'agence compatible.",
    demandesLabel: "Flux récemment routés",
    signauxLabel: "Signaux capturés",
  },
  apercuCrm: {
    searchPlaceholder: "Rechercher un flux…",
    navFluxRouted: "Flux routés",
    timelineAssigned: "Flux routé",
    timelineCurrent: "Flux routé",
  },
};

const MARKETING_COPY: Record<MarketingAudience, MarketingAudienceCopy> = {
  comptable: COMPTABLE_COPY,
  cif: CIF_COPY,
  agence: AGENCE_COPY,
};

export function getMarketingCopy(audience: MarketingAudience): MarketingAudienceCopy {
  return MARKETING_COPY[audience];
}

export const TERMINAL_SIGNAL_LINES = [
  { type: "route", text: "[route] intention qualifiée → capture hercule.dev" },
  { type: "signal", text: "[signal] création Sirene — boulangerie-laroche.fr" },
  { type: "stats", text: "[stats] +12 nouveaux flux PME aujourd'hui" },
  { type: "route", text: "[route] flux capturé — zone verrouillée" },
  { type: "signal", text: "[signal] changement EC — services-pro.com" },
  { type: "route", text: "[route] demande routée — honoraires 3 600 €/an validés" },
  { type: "signal", text: "[signal] transmission patrimoine — services-pro.com" },
  { type: "route", text: "[route] capture hercule.dev — queue +1" },
] as const;
