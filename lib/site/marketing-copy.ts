import { CONFERENCE_COHORT_SESSION } from "@/lib/cif-conference-sequence/constants";

export type MarketingAudience = "generic" | "comptable" | "cif" | "assurance" | "agence";

export const MARKETING_PRIMARY_CTA = "Réserver un audit de compatibilité";
export const MARKETING_INVITATION_ONLY_CTA = "Sur invitation";
export const MARKETING_SECONDARY_CTA = "Voir les projets";
export const MARKETING_AUDIT_CTA = "Réserver un audit de compatibilité";
export const MARKETING_NAV_PIPELINE = "Projets";

export const HERO_CTA_COURTIER_FINANCIER = "Je suis courtier financier";
export const HERO_CTA_COMPTABLE = "Je suis comptable";
export const HERO_CTA_COURTIER_ASSURANCE = "Je suis courtier en assurance";

export const HERO_EVENT_BADGE = "Session collective limitée";
export const HERO_EVENT_DATE = `${CONFERENCE_COHORT_SESSION.labelFrShort.charAt(0).toUpperCase()}${CONFERENCE_COHORT_SESSION.labelFrShort.slice(1)} · ${CONFERENCE_COHORT_SESSION.hourParis}`;
export const HERO_EVENT_SUBLINE =
  "Inscription ouverte selon nos capacités d'accueil — places limitées pour garantir la qualité des échanges.";
export const HERO_CTA_CONFERENCE = "S'inscrire à la conférence";

export const MARKETING_FOOTER_TAGLINE =
  "Courtage de projets B2B pour comptables, courtiers financiers et courtiers en assurance.";

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
  subtext: string;
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

type GarantiesCopy = {
  title: string;
  items: string[];
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
  garanties?: GarantiesCopy;
};

const GENERIC_COPY: MarketingAudienceCopy = {
  hero: {
    title: "Courtage de projets B2B pour comptables, courtiers financiers et courtiers en assurance",
    subtitle:
      "Hercule qualifie les demandes des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et attribue chaque projet en exclusivité au partenaire compatible.",
  },
  pilier: {
    headline: "Du courtage exclusif, pas une marketplace de projets.",
    intro:
      "Hercule qualifie les besoins des dirigeants et attribue chaque projet en exclusivité au partenaire de zone — comptable, courtier financier ou courtier en assurance.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 partenaire / zone. Les projets de votre territoire vous sont attribués — pas à un confrère.",
      },
      {
        title: "Qualification BNC · BIC · TNS",
        description:
          "Chaque demande est qualifiée selon le régime fiscal et le statut du dirigeant. Vous recevez des projets adaptés à votre offre.",
      },
      {
        title: "Attribution en 60 jours",
        description:
          "Cartographie de zone, filtres partenaire et mise en production. Aucun premier rendez-vous promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    eyebrow: "Projets",
    title: "Projets qualifiés attribués par Hercule",
    subtitle:
      "Aperçus illustratifs — chaque projet est confié en exclusivité à un partenaire de zone.",
    intro:
      "Hercule qualifie les besoins des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et route chaque projet vers le partenaire compatible.",
    disclaimer:
      "Ces exemples illustrent le flux de projets. Chaque attribution est exclusive au partenaire de zone. Les détails complets sont présentés lors de l'audit de compatibilité.",
  },
  auditLive: {
    eyebrow: "Courtage en direct",
    title: "Découvrez le flux de projets lors de l'audit de compatibilité.",
    intro:
      "Lors de l'échange, nous présentons le fonctionnement du courtage sur votre zone et vérifions la compatibilité de votre cabinet ou cabinet de courtage.",
    panelTitle: "Flux de projets · Audit en cours",
    panelSubtitle: "Tenue BNC · Zone Bordeaux",
    successLabel: "Compatibilité confirmée — projet attribué",
  },
  methodeRadar: {
    title: "Détection continue des besoins de zone",
    sectionTitle: "Comment Hercule identifie les projets",
    sectionBody:
      "Hercule détecte en continu les signaux d'intention : créations d'activité, changements de prestataire, échéances fiscales, besoins patrimoniaux et protection sociale. Ces dirigeants TPE, PME et indépendants (BNC, BIC, TNS) sont qualifiés puis attribués au partenaire le plus adapté.",
  },
  bandeAudit: {
    eyebrow: "Courtage de projets B2B — exclusif sur votre zone",
    title: "Réservez votre audit de compatibilité",
    intro:
      "Vérifions ensemble si le courtage Hercule peut être déployé sur votre zone et si votre cabinet a la bande passante pour absorber les projets.",
  },
  bandeStack: {
    text: "Des partenaires déploient le courtage Hercule sur leur zone.",
    subtext: "Attribution live en 60 jours — projets BNC, BIC et TNS qualifiés.",
  },
  grillePipeline: {
    eyebrow: "Projets",
    title: "Signaux capturés et projets qualifiés en continu",
    intro:
      "Hercule surveille les formalités Sirene et Pappers, capte les signaux d'intention en temps réel, puis qualifie chaque dirigeant TPE, PME ou indépendant (BNC, BIC, TNS) avant d'attribuer le projet au partenaire compatible.",
    demandesLabel: "Projets récemment attribués",
    signauxLabel: "Signaux capturés",
  },
  apercuCrm: {
    searchPlaceholder: "Rechercher un projet…",
    navFluxRouted: "Projets attribués",
    timelineAssigned: "Projet attribué",
    timelineCurrent: "Projet attribué",
  },
  garanties: {
    title: "Garanties courtage Hercule",
    items: [
      "Attribution exclusive sur votre zone — 0 % de commission sur vos honoraires",
      "Prospect absent en visio (malgré relance H-24) : projet recrédité, remplacement sous 14 jours ouvrés",
      "Projets qualifiés selon le régime fiscal et le statut (BNC, BIC, TNS)",
      "Audit de compatibilité avant tout engagement",
    ],
  },
};

const COMPTABLE_COPY: MarketingAudienceCopy = {
  hero: {
    title: "Courtage de projets comptables pour votre zone",
    subtitle:
      "Hercule qualifie les demandes des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et attribue chaque projet de tenue, fiscalité ou obligations administratives en exclusivité à votre cabinet.",
  },
  pilier: {
    headline: "Du courtage exclusif, pas une marketplace de dossiers.",
    intro:
      "Hercule attribue chaque projet comptable qualifié en exclusivité à votre cabinet de zone.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 cabinet / zone. Les projets de votre territoire alimentent votre pipeline — pas celui d'un confrère.",
      },
      {
        title: "Qualification BNC · BIC · TNS",
        description:
          "Chaque demande est qualifiée selon le régime et le statut du dirigeant. Vous recevez des projets adaptés à votre offre.",
      },
      {
        title: "Attribution en 60 jours",
        description:
          "Cartographie, filtres cabinet et mise en production. Aucun premier rendez-vous promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    eyebrow: "Projets",
    title: "Projets comptables qualifiés et attribués",
    subtitle: "Aperçus illustratifs — chaque projet est confié en exclusivité à un cabinet partenaire.",
    intro:
      "Hercule qualifie les besoins des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et route chaque projet vers le cabinet compatible.",
    disclaimer:
      "Ces exemples illustrent le flux de projets. Chaque attribution est exclusive au partenaire de zone. Les détails complets sont présentés lors de l'audit de compatibilité.",
  },
  auditLive: {
    eyebrow: "Courtage en direct",
    title: "Découvrez le flux de projets lors de l'audit de compatibilité.",
    intro:
      "Lors de l'échange, nous présentons le fonctionnement du courtage sur votre zone et vérifions la compatibilité de votre cabinet.",
    panelTitle: "Flux de projets · Audit en cours",
    panelSubtitle: "Tenue comptable · Zone Bordeaux",
    successLabel: "Compatibilité confirmée — projet attribué",
  },
  methodeRadar: {
    title: "Détection continue des besoins comptables de zone",
    sectionTitle: "Comment Hercule identifie les projets",
    sectionBody:
      "Hercule détecte en continu les signaux d'intention : créations d'activité, changements d'expert-comptable, échéances fiscales et autres indicateurs. Ces dirigeants TPE, PME et indépendants (BNC, BIC, TNS) sont qualifiés puis attribués au cabinet le plus adapté.",
  },
  bandeAudit: {
    eyebrow: "Courtage de projets comptables — exclusif sur votre zone",
    title: "Réservez votre audit de compatibilité",
    intro:
      "Vérifions ensemble si le courtage Hercule peut être déployé sur votre zone et si votre cabinet a la bande passante pour absorber les projets.",
  },
  bandeStack: {
    text: "Des cabinets partenaires déploient le courtage Hercule sur leur zone.",
    subtext: "Attribution live en 60 jours — tenue, fiscal, obligations administratives (BNC, BIC, TNS).",
  },
  grillePipeline: {
    eyebrow: "Projets",
    title: "Signaux capturés et projets qualifiés en continu",
    intro:
      "Hercule surveille les formalités Sirene et Pappers, capte les signaux d'intention en temps réel, puis qualifie chaque dirigeant TPE, PME ou indépendant (BNC, BIC, TNS) avant d'attribuer le projet au cabinet compatible.",
    demandesLabel: "Projets récemment attribués",
    signauxLabel: "Signaux capturés",
  },
  apercuCrm: {
    searchPlaceholder: "Rechercher un projet…",
    navFluxRouted: "Projets attribués",
    timelineAssigned: "Projet attribué",
    timelineCurrent: "Projet attribué",
  },
};

const CIF_COPY: MarketingAudienceCopy = {
  ...COMPTABLE_COPY,
  hero: {
    title: "Courtage de projets patrimoniaux pour votre zone",
    subtitle:
      "Hercule qualifie les besoins patrimoniaux des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et attribue chaque projet en exclusivité à votre cabinet CIF.",
  },
  pilier: {
    ...COMPTABLE_COPY.pilier,
    intro:
      "Hercule attribue chaque projet patrimonial qualifié en exclusivité à votre cabinet CIF de zone.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 cabinet / zone. Les projets patrimoniaux de votre territoire vous sont attribués — pas à un confrère.",
      },
      {
        title: "Qualification BNC · BIC · TNS",
        description:
          "Chaque demande est qualifiée selon le régime et le statut du dirigeant. Vous recevez des projets adaptés à votre offre CIF.",
      },
      {
        title: "Attribution en 60 jours",
        description:
          "Cartographie, filtres cabinet et mise en production. Aucun premier rendez-vous promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    ...COMPTABLE_COPY.bandeProjets,
    intro:
      "Hercule qualifie les besoins patrimoniaux des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et route chaque projet vers le cabinet CIF compatible.",
  },
  auditLive: {
    ...COMPTABLE_COPY.auditLive,
    panelSubtitle: "Optimisation fiscale · Zone Lyon",
  },
  methodeRadar: {
    ...COMPTABLE_COPY.methodeRadar,
    title: "Détection continue des besoins patrimoniaux de zone",
    sectionBody:
      "Hercule détecte en continu les signaux patrimoniaux : transmission, trésorerie, retraite et autres indicateurs. Ces dirigeants TPE, PME et indépendants (BNC, BIC, TNS) sont qualifiés puis attribués au cabinet CIF le plus adapté.",
  },
  bandeAudit: {
    eyebrow: "Courtage de projets patrimoniaux — exclusif sur votre zone",
    title: "Réservez votre audit de compatibilité",
    intro:
      "Vérifions ensemble si le courtage Hercule peut être déployé sur votre zone et si votre cabinet CIF a la bande passante pour absorber les projets.",
  },
  bandeStack: {
    text: "Des cabinets CIF partenaires déploient le courtage Hercule sur leur zone.",
    subtext: "Attribution live en 60 jours — patrimoine, transmission, fiscalité (BNC, BIC, TNS).",
  },
  grillePipeline: {
    ...COMPTABLE_COPY.grillePipeline,
    intro:
      "Hercule surveille les formalités Sirene et Pappers, capte les signaux patrimoniaux en temps réel, puis qualifie chaque dirigeant TPE, PME ou indépendant (BNC, BIC, TNS) avant d'attribuer le projet au cabinet compatible.",
  },
};

const ASSURANCE_COPY: MarketingAudienceCopy = {
  hero: {
    title: "Courtage de projets prévoyance et assurance pour votre zone",
    subtitle:
      "Hercule qualifie les besoins de protection sociale des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et attribue chaque projet en exclusivité à votre cabinet de courtage (ORIAS).",
  },
  pilier: {
    headline: "Du courtage exclusif, pas une marketplace de leads.",
    intro:
      "Hercule attribue chaque projet prévoyance, santé collective ou protection sociale en exclusivité à votre cabinet de zone.",
    cards: [
      {
        title: "Zone exclusive",
        description:
          "Verrou 1 cabinet / zone. Les projets de protection sociale de votre territoire vous sont attribués — pas à un confrère.",
      },
      {
        title: "Qualification BNC · BIC · TNS",
        description:
          "Chaque demande est qualifiée selon le régime et le statut du dirigeant. Vous recevez des projets adaptés à votre offre ORIAS.",
      },
      {
        title: "Attribution en 60 jours",
        description:
          "Cartographie, filtres cabinet et mise en production. Aucun premier rendez-vous promis pendant le déploiement.",
      },
    ],
  },
  bandeProjets: {
    eyebrow: "Projets",
    title: "Projets prévoyance et assurance qualifiés",
    subtitle:
      "Aperçus illustratifs — chaque projet est confié en exclusivité à un cabinet de courtage partenaire.",
    intro:
      "Hercule qualifie les besoins de protection sociale des dirigeants TPE, PME et indépendants (BNC, BIC, TNS) et route chaque projet vers le cabinet compatible.",
    disclaimer:
      "Ces exemples illustrent le flux de projets. Chaque attribution est exclusive au partenaire de zone. Les détails complets sont présentés lors de l'audit de compatibilité.",
  },
  auditLive: {
    eyebrow: "Courtage en direct",
    title: "Découvrez le flux de projets lors de l'audit de compatibilité.",
    intro:
      "Lors de l'échange, nous présentons le fonctionnement du courtage sur votre zone et vérifions la compatibilité de votre cabinet.",
    panelTitle: "Flux de projets · Audit en cours",
    panelSubtitle: "Prévoyance collective · Zone Nantes",
    successLabel: "Compatibilité confirmée — projet attribué",
  },
  methodeRadar: {
    title: "Détection continue des besoins de protection sociale",
    sectionTitle: "Comment Hercule identifie les projets",
    sectionBody:
      "Hercule détecte en continu les signaux d'intention : créations d'activité, changements de régime, besoins de prévoyance, santé collective et protection sociale. Ces dirigeants TPE, PME et indépendants (BNC, BIC, TNS) sont qualifiés puis attribués au cabinet le plus adapté.",
  },
  bandeAudit: {
    eyebrow: "Courtage de projets prévoyance — exclusif sur votre zone",
    title: "Réservez votre audit de compatibilité",
    intro:
      "Vérifions ensemble si le courtage Hercule peut être déployé sur votre zone et si votre cabinet a la bande passante pour absorber les projets.",
  },
  bandeStack: {
    text: "Des cabinets de courtage partenaires déploient Hercule sur leur zone.",
    subtext: "Attribution live en 60 jours — prévoyance, santé collective, protection sociale (BNC, BIC, TNS).",
  },
  grillePipeline: {
    eyebrow: "Projets",
    title: "Signaux capturés et projets qualifiés en continu",
    intro:
      "Hercule capte les signaux d'intention en temps réel, puis qualifie chaque dirigeant TPE, PME ou indépendant (BNC, BIC, TNS) avant d'attribuer le projet au cabinet de courtage compatible.",
    demandesLabel: "Projets récemment attribués",
    signauxLabel: "Signaux capturés",
  },
  apercuCrm: {
    searchPlaceholder: "Rechercher un projet…",
    navFluxRouted: "Projets attribués",
    timelineAssigned: "Projet attribué",
    timelineCurrent: "Projet attribué",
  },
};

/** Kept for internal / legacy components; public /agence redirects to /. */
const AGENCE_COPY: MarketingAudienceCopy = {
  ...GENERIC_COPY,
  bandeStack: {
    text: "Des partenaires déploient le courtage Hercule sur leur zone.",
    subtext: "Attribution live en 60 jours — projets B2B qualifiés.",
  },
};

const MARKETING_COPY: Record<MarketingAudience, MarketingAudienceCopy> = {
  generic: GENERIC_COPY,
  comptable: COMPTABLE_COPY,
  cif: CIF_COPY,
  assurance: ASSURANCE_COPY,
  agence: AGENCE_COPY,
};

export function getMarketingCopy(audience: MarketingAudience): MarketingAudienceCopy {
  return MARKETING_COPY[audience];
}

export const TERMINAL_SIGNAL_LINES = [
  { type: "route", text: "[route] intention qualifiée → attribution hercule.dev" },
  { type: "signal", text: "[signal] création Sirene BNC — cabinet-laroche.fr" },
  { type: "stats", text: "[stats] +12 nouveaux projets TPE/PME aujourd'hui" },
  { type: "route", text: "[route] projet attribué — zone verrouillée" },
  { type: "signal", text: "[signal] changement EC BIC — services-pro.com" },
  { type: "route", text: "[route] projet attribué — honoraires 3 600 €/an validés" },
  { type: "signal", text: "[signal] besoin prévoyance TNS — services-pro.com" },
  { type: "route", text: "[route] attribution hercule.dev — queue +1" },
] as const;
