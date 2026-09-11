import type { LeadCategory } from "@/lib/link-tracking/types";
import {
  CLIENTS_MODULE_CAPTION,
  CLIENTS_MODULE_LABEL,
  PRODUCT_ROOT_LABEL,
  SEGMENT_LABELS,
  SESSION_MODULE_CAPTION,
  SESSION_MODULE_LABEL,
} from "@/lib/admin/funnels/ui-copy";

export type { LeadCategory };

/** Transversal niche axis (spec §2.3). */
export type Niche = LeadCategory;

/** @deprecated Use Niche — kept for transitional imports. */
export type Audience = Niche;

export type NavNode = {
  label: string;
  caption?: string;
  children?: Record<string, NavNode>;
  leaf?: string;
};

export const NICHE_LABELS: Record<Niche, string> = {
  agence: "Agence",
  entreprise: "Entreprise",
  comptable: "Comptable",
  cif: "Conseiller financier",
};

/** @deprecated Use NICHE_LABELS */
export const AUDIENCE_LABELS = NICHE_LABELS;

export const NICHE_ICONS: Record<Niche, string> = {
  agence: "🏢",
  entreprise: "🏭",
  comptable: "📊",
  cif: "💼",
};

/** @deprecated Use NICHE_ICONS */
export const AUDIENCE_ICONS = NICHE_ICONS;

export const NICHE_CAPTIONS: Record<Niche, string> = {
  agence: "Buyer — agences partenaires qui reçoivent des contrats.",
  entreprise: "Seller — entreprises qui recherchent une agence.",
  comptable: "Buyer — cabinets d'expertise comptable partenaires.",
  cif: "Buyer — cabinets CIF / CGP partenaires.",
};

/** @deprecated Use NICHE_CAPTIONS */
export const AUDIENCE_CAPTIONS = NICHE_CAPTIONS;

export const ALL_NICHES: Niche[] = ["agence", "entreprise", "comptable", "cif"];

const NICHE_PATH_SEGMENT = "agence|comptable|entreprise|cif";

/** @deprecated Use ALL_NICHES */
const ALL_AUDIENCES = ALL_NICHES;

export const NICHE_STORAGE_KEY = "hercule:niche";

export const LEGAL_DOC_SEGMENTS = [
  "cgv",
  "mentions",
  "confidentialite",
  "faq",
  "pricing",
] as const;

export type LegalDocSegment = (typeof LEGAL_DOC_SEGMENTS)[number];

function legalTree(): Record<string, NavNode> {
  return {
    cgv: { label: "CGV", leaf: "legal_cgv" },
    mentions: { label: "Mentions légales", leaf: "legal_mentions" },
    confidentialite: { label: "Confidentialité", leaf: "legal_confidentialite" },
    faq: { label: "FAQ", leaf: "legal_faq" },
    pricing: { label: "Pricing", leaf: "legal_pricing" },
  };
}

const FULL_MODULES: Record<string, NavNode> = {
  sales: {
    label: SESSION_MODULE_LABEL,
    caption: SESSION_MODULE_CAPTION,
  },
  bookings: {
    label: "Bookings",
    caption: "RDV Calendly et liens prospect.",
    leaf: "bookings_hub",
  },
  clients: {
    label: CLIENTS_MODULE_LABEL,
    caption: CLIENTS_MODULE_CAPTION,
    leaf: "clients_hub",
  },
  legal: {
    label: "CVG & légal",
    caption: "Documents légaux par niche.",
    children: legalTree(),
  },
  emails: {
    label: "Emails",
    caption: "Séquences email PRE-CLOSE et CLOSE.",
    leaf: "emails_hub",
  },
};

export const MODULES = FULL_MODULES;

export function isNiche(value: string): value is Niche {
  return ALL_NICHES.includes(value as Niche);
}

/** @deprecated Use isNiche */
export function isAudience(value: string): value is Audience {
  return isNiche(value);
}

export { isLeadCategory } from "@/lib/link-tracking/types";

export function isLegalDocSegment(value: string): value is LegalDocSegment {
  return (LEGAL_DOC_SEGMENTS as readonly string[]).includes(value);
}

export function getModulesForAudience(audience: Audience): Record<string, NavNode> {
  return FULL_MODULES;
}

/** @deprecated Use getModulesForAudience — all niches share the same module set. */
export function getModulesForNiche(niche: Niche): Record<string, NavNode> {
  return FULL_MODULES;
}

export function nodeIsLeaf(node: NavNode): boolean {
  return Boolean(node.leaf) && !node.children;
}

export function normalizePath(path: string[]): string[] {
  if (path.length === 0) {
    return [];
  }

  const audience = path[0];
  if (!isNiche(audience)) {
    return [audience];
  }

  let currentChildren = getModulesForNiche(audience);
  const normalized: string[] = [audience];

  for (const segment of path.slice(1)) {
    const child = currentChildren[segment];
    if (!child) {
      break;
    }
    normalized.push(segment);
    currentChildren = child.children ?? {};
  }

  return normalized;
}

export function resolveNode(path: string[]): NavNode | null {
  if (path.length < 2) {
    return null;
  }

  const audience = path[0];
  if (!isNiche(audience)) {
    return null;
  }

  let node: NavNode | undefined = getModulesForNiche(audience)[path[1]];
  for (const segment of path.slice(2)) {
    if (!node) {
      return null;
    }
    node = node.children?.[segment];
  }

  return node ?? null;
}

export function getChildren(path: string[]): Record<string, NavNode> {
  if (path.length === 1 && isNiche(path[0])) {
    return getModulesForNiche(path[0]);
  }

  const node = resolveNode(path);
  if (!node?.children) {
    return {};
  }

  return node.children;
}

export function isHub(path: string[]): boolean {
  if (path.length === 1 && isNiche(path[0])) {
    return true;
  }

  const node = resolveNode(path);
  if (!node) {
    return false;
  }

  return Boolean(node.children) && !nodeIsLeaf(node);
}

export function leafKey(path: string[]): string | null {
  const node = resolveNode(path);
  if (!node || !nodeIsLeaf(node)) {
    return null;
  }
  return node.leaf ?? null;
}

export function breadcrumb(path: string[]): string {
  const labels = [PRODUCT_ROOT_LABEL];
  if (path.length === 0) {
    return labels.join(" › ");
  }

  if (isNiche(path[0])) {
    labels.push(NICHE_LABELS[path[0]]);
  } else {
    labels.push(path[0]);
  }

  const audience = isNiche(path[0]) ? path[0] : null;
  let currentChildren = audience ? getModulesForNiche(audience) : MODULES;
  for (const segment of path.slice(1)) {
    const node = currentChildren[segment];
    if (!node) {
      labels.push(SEGMENT_LABELS[segment] ?? segment);
      break;
    }
    labels.push(node.label);
    currentChildren = node.children ?? {};
  }

  return labels.join(" › ");
}

export function pathToHref(path: string[]): string {
  if (path.length === 0) {
    return "/internal/funnels";
  }
  return `/internal/funnels/${path.join("/")}`;
}

/** Live session funnel — URL unchanged (spec §2.2). */
export function salesFunnelHref(niche: Niche): string {
  return pathToHref([niche, "sales", "funnel"]);
}

export function sessionHubHref(niche: Niche): string {
  return `/internal/funnels/session/${niche}`;
}

export function bookingsHref(niche: Niche): string {
  return `/internal/funnels/bookings/${niche}`;
}

export function clientsHubHref(niche: Niche = "agence"): string {
  return `/internal/funnels/clients/${niche}`;
}

export function legalHref(niche: Niche, doc?: LegalDocSegment): string {
  if (!doc) {
    return `/internal/funnels/legal/${niche}`;
  }
  return `/internal/funnels/legal/${niche}/${doc}`;
}

export function emailsHref(niche: Niche, slug?: string): string {
  if (!slug) {
    return `/internal/funnels/emails/${niche}`;
  }
  return `/internal/funnels/emails/${niche}/${slug}`;
}

const MODULE_FIRST_PATTERNS: Array<{ module: string; pattern: RegExp }> = [
  { module: "session", pattern: new RegExp(`^/internal/funnels/session/(${NICHE_PATH_SEGMENT})`) },
  { module: "bookings", pattern: new RegExp(`^/internal/funnels/bookings/(${NICHE_PATH_SEGMENT})`) },
  { module: "clients", pattern: new RegExp(`^/internal/funnels/clients/(${NICHE_PATH_SEGMENT})`) },
  { module: "legal", pattern: new RegExp(`^/internal/funnels/legal/(${NICHE_PATH_SEGMENT})`) },
  { module: "emails", pattern: new RegExp(`^/internal/funnels/emails/(${NICHE_PATH_SEGMENT})`) },
];

/**
 * Extract niche from pathname — supports module-first and legacy audience-first URLs.
 */
export function nicheFromPathname(pathname: string): Niche {
  for (const { pattern } of MODULE_FIRST_PATTERNS) {
    const match = pathname.match(pattern);
    if (match?.[1] && isNiche(match[1])) {
      return match[1];
    }
  }

  const legacyFunnel = pathname.match(
    new RegExp(`^/internal/funnels/(${NICHE_PATH_SEGMENT})`),
  );
  if (legacyFunnel?.[1] && isNiche(legacyFunnel[1])) {
    return legacyFunnel[1];
  }

  const cockpitMatch = pathname.match(
    new RegExp(`^/internal/clients/(${NICHE_PATH_SEGMENT})`),
  );
  if (cockpitMatch?.[1] && isNiche(cockpitMatch[1])) {
    return cockpitMatch[1];
  }

  return "agence";
}

export function moduleFromPathname(pathname: string): string | null {
  for (const { module, pattern } of MODULE_FIRST_PATTERNS) {
    if (pattern.test(pathname)) {
      return module;
    }
  }

  const legacy = pathname.match(
    new RegExp(`^/internal/funnels/(${NICHE_PATH_SEGMENT})/([^/]+)`),
  );
  if (legacy?.[2]) {
    return legacy[2];
  }

  return null;
}

export function hubTitle(path: string[]): string {
  if (path.length === 1) {
    return "Choisissez un module";
  }
  if (path.length === 2) {
    return "Choisissez une section";
  }
  return "Choisissez une étape";
}
