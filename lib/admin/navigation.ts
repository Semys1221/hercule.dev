import {
  CLIENTS_MODULE_CAPTION,
  CLIENTS_MODULE_LABEL,
  PRODUCT_ROOT_LABEL,
  SEGMENT_LABELS,
  SESSION_MODULE_CAPTION,
  SESSION_MODULE_LABEL,
} from "@/lib/admin/funnels/ui-copy";

export type Audience = "agence" | "entreprise";

export type NavNode = {
  label: string;
  caption?: string;
  children?: Record<string, NavNode>;
  leaf?: string;
};

export const AUDIENCE_LABELS: Record<Audience, string> = {
  agence: "Agence",
  entreprise: "Entreprise",
};

export const AUDIENCE_ICONS: Record<Audience, string> = {
  agence: "🏢",
  entreprise: "🏭",
};

export const AUDIENCE_CAPTIONS: Record<Audience, string> = {
  agence: "Buyer — agences partenaires qui reçoivent des contrats.",
  entreprise: "Seller — entreprises qui recherchent une agence.",
};

function legalTree(): Record<string, NavNode> {
  return {
    cgv: { label: "CGV", leaf: "legal_cgv" },
    mentions: { label: "Mentions légales", leaf: "legal_mentions" },
    confidentialite: { label: "Confidentialité", leaf: "legal_confidentialite" },
    faq: { label: "FAQ", leaf: "legal_faq" },
    pricing: { label: "Pricing", leaf: "legal_pricing" },
  };
}

export const MODULES: Record<string, NavNode> = {
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
    caption: "Documents légaux par audience.",
    children: legalTree(),
  },
  emails: {
    label: "Emails",
    caption: "Séquences email PRE-CLOSE et CLOSE.",
    leaf: "emails_hub",
  },
};

export function isAudience(value: string): value is Audience {
  return value === "agence" || value === "entreprise";
}

export function nodeIsLeaf(node: NavNode): boolean {
  return Boolean(node.leaf) && !node.children;
}

export function normalizePath(path: string[]): string[] {
  if (path.length === 0) {
    return [];
  }

  const audience = path[0];
  if (!isAudience(audience)) {
    return [audience];
  }

  let currentChildren: Record<string, NavNode> = MODULES;
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

  let node: NavNode | undefined = MODULES[path[1]];
  for (const segment of path.slice(2)) {
    if (!node) {
      return null;
    }
    node = node.children?.[segment];
  }

  return node ?? null;
}

export function getChildren(path: string[]): Record<string, NavNode> {
  if (path.length === 1 && isAudience(path[0])) {
    return MODULES;
  }

  const node = resolveNode(path);
  if (!node?.children) {
    return {};
  }

  return node.children;
}

export function isHub(path: string[]): boolean {
  if (path.length === 1 && isAudience(path[0])) {
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

  if (isAudience(path[0])) {
    labels.push(AUDIENCE_LABELS[path[0]]);
  } else {
    labels.push(path[0]);
  }

  let currentChildren = MODULES;
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

export function salesFunnelHref(audience: Audience): string {
  return pathToHref([audience, "sales", "funnel"]);
}

export function clientsHubHref(audience: Audience = "agence"): string {
  return pathToHref([audience, "clients"]);
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
