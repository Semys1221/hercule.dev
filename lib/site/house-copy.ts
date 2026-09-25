import { HERO_EVENT_DATE } from "@/lib/site/marketing-copy"

export type HouseAudience =
  | "home"
  | "comptable"
  | "cif"
  | "assurance"
  | "agence"
  | "entreprise"

export const HOUSE_NAV_LINKS = [
  { href: "#methode", label: "Méthode" },
  { href: "#missions", label: "Projets" },
  { href: "#garanties", label: "Garanties" },
  { href: "/faq", label: "FAQ" },
  { href: "/a-propos", label: "À propos" },
] as const

export const HOUSE_HERO_LINKS = [
  { href: "/comptable", label: "Comptable" },
  { href: "/conseil-financier", label: "Conseil financier" },
  { href: "/courtier-assurance", label: "Courtage" },
  { href: "/agence", label: "Agence" },
  { href: "/entreprise", label: "Entreprise" },
] as const

const HERO_BY_AUDIENCE: Record<HouseAudience, { title: string; subtitle: string }> = {
  home: {
    title: "L’essentiel.",
    subtitle: "Infrastructure sobre pour ce qui doit tenir dans la durée.",
  },
  comptable: {
    title: "Comptable.",
    subtitle: "Rigueur, continuité et outillage au service du métier.",
  },
  cif: {
    title: "Conseil financier.",
    subtitle: "Patience, précision et discrétion sur le long terme.",
  },
  assurance: {
    title: "Courtage.",
    subtitle: "Clarté et constance là où la protection se joue.",
  },
  agence: {
    title: "Agence.",
    subtitle: "Une présence numérique déployée sans bruit.",
  },
  entreprise: {
    title: "Entreprise.",
    subtitle: "Une ligne claire quand la décision se précise.",
  },
}

export function getHouseHero(audience: HouseAudience) {
  return HERO_BY_AUDIENCE[audience]
}

type ProductTabsCopy = {
  intro: string
  items: readonly { id: string; label: string; body: string }[]
}

const NICHE_PRODUCT_TABS: ProductTabsCopy = {
  intro: "Une surface, plusieurs disciplines.",
  items: [
    {
      id: "comptable",
      label: "Comptable",
      body: "Tenue, fiscalité et obligations administratives pour dirigeants BNC, BIC et TNS.",
    },
    {
      id: "cif",
      label: "Conseil financier",
      body: "Patrimoine, transmission et optimisation — projets qualifiés avant mise en relation.",
    },
    {
      id: "assurance",
      label: "Courtage",
      body: "Prévoyance, santé collective et protection sociale pour cabinets ORIAS.",
    },
    {
      id: "agence",
      label: "Agence",
      body: "Hercule qualifie les signaux et route les flux vers le partenaire compatible.",
    },
    {
      id: "entreprise",
      label: "Entreprise",
      body: "Dirigeants TPE, PME et ETI : mise en relation gratuite avec un cabinet adapté.",
    },
  ],
}

const HOME_PRODUCT_TABS: ProductTabsCopy = {
  intro: "Une surface, plusieurs disciplines.",
  items: [
    {
      id: "comptable",
      label: "Comptable",
      body: "Qualification et mise en relation pour les missions de conseil et de tenue.",
    },
    {
      id: "cif",
      label: "Conseil financier",
      body: "Parcours patrimoniaux structurés avant le premier rendez-vous.",
    },
    {
      id: "assurance",
      label: "Courtage",
      body: "Demandes prévoyance et protection, filtrées et routées proprement.",
    },
    {
      id: "agence",
      label: "Agence",
      body: "Outils et flux pour déployer la plateforme sur votre territoire.",
    },
    {
      id: "entreprise",
      label: "Entreprise",
      body: "Un interlocuteur adapté, sans marketplace ni diffusion large.",
    },
  ],
}

export function getHouseProductTabs(audience: HouseAudience): ProductTabsCopy {
  return audience === "home" ? HOME_PRODUCT_TABS : NICHE_PRODUCT_TABS
}

const NICHE_MARQUEE_ITEMS = [
  "Sirene",
  "Pappers",
  "Zone verrouillée",
  "Exclusivité",
  "Qualification téléphonique",
  "Attribution",
] as const

const HOME_MARQUEE_ITEMS = [
  "Signaux publics",
  "Enrichissement",
  "Qualification",
  "Routage",
  "Exclusivité",
  "Suivi",
] as const

export function getHouseMarqueeItems(audience: HouseAudience): readonly string[] {
  return audience === "home" ? HOME_MARQUEE_ITEMS : NICHE_MARQUEE_ITEMS
}

type DualCopy = {
  heading: string
  cabinets: { title: string; body: string; href: string }
  entreprises: { title: string; body: string; href: string }
}

const NICHE_DUAL: DualCopy = {
  heading: "Deux rythmes, un même socle.",
  cabinets: {
    title: "Cabinets",
    body: "Recevoir des projets qualifiés, en exclusivité de zone.",
    href: "/comptable",
  },
  entreprises: {
    title: "Entreprises",
    body: "Être mis en relation avec un cabinet compatible.",
    href: "/entreprise",
  },
}

const HOME_DUAL: DualCopy = {
  heading: "Deux rythmes, un même socle.",
  cabinets: {
    title: "Partenaires",
    body: "Des demandes qualifiées, un canal numérique, une zone protégée.",
    href: "/comptable",
  },
  entreprises: {
    title: "Organisations",
    body: "Exprimer un besoin et être orienté vers le bon service.",
    href: "/entreprise",
  },
}

export function getHouseDual(audience: HouseAudience): DualCopy {
  return audience === "home" ? HOME_DUAL : NICHE_DUAL
}

type DeepCourtageCopy = {
  title: string
  cards: readonly { title: string; body: string }[]
}

const NICHE_DEEP_COURTAGE: DeepCourtageCopy = {
  title: "Avant l’échange.",
  cards: [
    { title: "Zone exclusive", body: "Un partenaire par territoire — pas de marketplace." },
    { title: "Qualification", body: "Chaque demande est vérifiée avant attribution." },
    { title: "Attribution", body: "Le projet est confié au cabinet compatible." },
  ],
}

const HOME_DEEP_COURTAGE: DeepCourtageCopy = {
  title: "Avant l’échange.",
  cards: [
    { title: "Données", body: "Signaux et contexte consolidés dans un même flux." },
    { title: "Qualification", body: "Chaque demande est cadrée avant mise en relation." },
    { title: "Livraison", body: "Le bon interlocuteur reçoit le dossier prêt à traiter." },
  ],
}

export function getHouseDeepCourtage(audience: HouseAudience): DeepCourtageCopy {
  return audience === "home" ? HOME_DEEP_COURTAGE : NICHE_DEEP_COURTAGE
}

type DeepProjectsCopy = { title: string; body: string }

const NICHE_DEEP_PROJECTS: DeepProjectsCopy = {
  title: "Ce qui circule, en vrai.",
  body: "Chaque attribution est exclusive. Les aperçus illustrent le flux ; le détail reste dans l’échange.",
}

const HOME_DEEP_PROJECTS: DeepProjectsCopy = {
  title: "Ce qui circule, en vrai.",
  body: "Les aperçus reflètent l’activité du flux ; le détail se traite dans le canal habituel.",
}

export function getHouseDeepProjects(audience: HouseAudience): DeepProjectsCopy {
  return audience === "home" ? HOME_DEEP_PROJECTS : NICHE_DEEP_PROJECTS
}

type DeepAgenceCopy = { title: string; body: string; href: string }

const NICHE_DEEP_AGENCE: DeepAgenceCopy = {
  title: "Sous le capot.",
  body: "Hercule opère la qualification et le routage pour les partenaires.",
  href: "/agence",
}

const HOME_DEEP_AGENCE: DeepAgenceCopy = {
  title: "Sous le capot.",
  body: "Qualification, routage et suivi — le socle numérique derrière chaque mise en relation.",
  href: "/agence",
}

export function getHouseDeepAgence(audience: HouseAudience): DeepAgenceCopy {
  return audience === "home" ? HOME_DEEP_AGENCE : NICHE_DEEP_AGENCE
}

type ImpactStat = { value: number; suffix: string; label: string }

type ImpactCopy = { title: string; stats: readonly ImpactStat[] }

const NICHE_IMPACT: ImpactCopy = {
  title: "En continu.",
  stats: [
    { value: 847, suffix: "+", label: "TPE/PME surveillées" },
    { value: 12, suffix: "", label: "Projets / jour" },
    { value: 24, suffix: "/7", label: "Collecte" },
  ],
}

const HOME_IMPACT: ImpactCopy = {
  title: "En continu.",
  stats: [
    { value: 847, suffix: "+", label: "Signaux suivis" },
    { value: 12, suffix: "", label: "Demandes traitées / jour" },
    { value: 24, suffix: "/7", label: "Collecte" },
  ],
}

export function getHouseImpact(audience: HouseAudience): ImpactCopy {
  return audience === "home" ? HOME_IMPACT : NICHE_IMPACT
}

type MethodCopy = {
  title: string
  steps: readonly { title: string; body: string }[]
}

const NICHE_METHOD: MethodCopy = {
  title: "Comment ça tient.",
  steps: [
    { title: "Signal", body: "Formalités et signaux d’intention captés en continu." },
    { title: "Qualification", body: "Besoin, régime et compatibilité vérifiés." },
    { title: "Attribution", body: "Projet confié au partenaire de zone." },
    { title: "Exclusivité", body: "Pas de diffusion concurrente sur le même territoire." },
  ],
}

const HOME_METHOD: MethodCopy = {
  title: "Comment ça tient.",
  steps: [
    { title: "Signal", body: "Intentions et événements captés en continu sur le flux." },
    { title: "Qualification", body: "Besoin, contexte et compatibilité clarifiés." },
    { title: "Mise en relation", body: "Dossier transmis au partenaire adapté." },
    { title: "Exclusivité", body: "Pas de diffusion parallèle sur le même territoire." },
  ],
}

export function getHouseMethod(audience: HouseAudience): MethodCopy {
  return audience === "home" ? HOME_METHOD : NICHE_METHOD
}

type GuaranteesCopy = {
  title: string
  items: readonly { q: string; a: string }[]
}

const NICHE_GUARANTEES: GuaranteesCopy = {
  title: "Ce qui est tenu.",
  items: [
    {
      q: "Exclusivité de zone",
      a: "Attribution exclusive sur votre territoire — 0 % de commission sur vos honoraires.",
    },
    {
      q: "Visio",
      a: "Prospect absent malgré relance : projet recrédité, remplacement sous 14 jours ouvrés.",
    },
    {
      q: "Régimes",
      a: "Projets qualifiés selon BNC, BIC et TNS.",
    },
    {
      q: "Compatibilité",
      a: "Audit de compatibilité avant tout engagement.",
    },
  ],
}

const HOME_GUARANTEES: GuaranteesCopy = {
  title: "Ce qui est tenu.",
  items: [
    {
      q: "Territoire",
      a: "Un partenaire par zone — pas de marketplace ouverte.",
    },
    {
      q: "Engagement",
      a: "Rendez-vous manqué malgré relance : dossier recrédité ou remplacé sous 14 jours ouvrés.",
    },
    {
      q: "Cadrage",
      a: "Chaque demande est qualifiée avant toute mise en relation.",
    },
    {
      q: "Compatibilité",
      a: "Vérification du fit avant transmission du contact.",
    },
  ],
}

export function getHouseGuarantees(audience: HouseAudience): GuaranteesCopy {
  return audience === "home" ? HOME_GUARANTEES : NICHE_GUARANTEES
}

type UpdateItem = { href: string; title: string; meta: string }

const NICHE_UPDATES: readonly UpdateItem[] = [
  { href: "/faq", title: "FAQ cabinets", meta: "Comptable, CIF, assurance" },
  { href: "/entreprise", title: "FAQ entreprise", meta: "Dirigeants TPE, PME, ETI" },
  {
    href: "/conference/inscription",
    title: "Conférence",
    meta: `${HERO_EVENT_DATE} — inscription sur invitation`,
  },
]

const HOME_UPDATES: readonly UpdateItem[] = [
  { href: "/faq", title: "FAQ métiers", meta: "Réponses par filière" },
  { href: "/entreprise", title: "FAQ dirigeants", meta: "Organisations et décideurs" },
  {
    href: "/conference/inscription",
    title: "Conférence",
    meta: `${HERO_EVENT_DATE} — inscription sur invitation`,
  },
]

export function getHouseUpdates(audience: HouseAudience): readonly UpdateItem[] {
  return audience === "home" ? HOME_UPDATES : NICHE_UPDATES
}

export const HOUSE_CLOSING = {
  title: "hercule.dev",
  line: "Le reste se dit dans le mail.",
} as const

const NICHE_FOOTER_TAGLINE =
  "Courtage de projets B2B pour comptables, courtiers financiers et courtiers en assurance."

const HOME_FOOTER_TAGLINE = "Services numériques et mise en relation pour les projets B2B."

export function getHouseFooterTagline(audience: HouseAudience): string {
  return audience === "home" ? HOME_FOOTER_TAGLINE : NICHE_FOOTER_TAGLINE
}
