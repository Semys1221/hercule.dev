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
  agence: "Buyer — agences partenaires qui reçoivent des demandes qualifiées.",
  entreprise: "Seller — entreprises qui recherchent une agence.",
};

function salesTree(): Record<string, NavNode> {
  return {
    funnel: {
      label: "Funnel",
      caption: "Parcours commercial discovery → pitch → closing.",
      children: {
        discovery: { label: "Discovery", leaf: "sales_funnel_discovery" },
        pitch: { label: "Pitch", leaf: "sales_funnel_pitch" },
        closing: { label: "Closing", leaf: "sales_funnel_closing" },
      },
    },
    mockup: {
      label: "Fiches mockup",
      caption: "Cartes carousel homepage agence (agence_demandes).",
      leaf: "sales_mockup",
    },
  };
}

function onboardingTree(): Record<string, NavNode> {
  return {
    funnel: {
      label: "Funnel",
      caption: "Parcours onboarding — contenu à venir.",
      leaf: "onboarding_funnel",
    },
    fiche_form: {
      label: "Fiche form",
      caption: "Créer une fiche réelle en base.",
      leaf: "onboarding_fiche_form",
    },
  };
}

function legalTree(): Record<string, NavNode> {
  return {
    cgv: { label: "CGV", leaf: "legal_cgv" },
    mentions: { label: "Mentions légales", leaf: "legal_mentions" },
    confidentialite: { label: "Confidentialité", leaf: "legal_confidentialite" },
    faq: { label: "FAQ", leaf: "legal_faq" },
  };
}

function emailsTree(): Record<string, NavNode> {
  return {
    pre_close: {
      label: "PRE-CLOSE",
      caption: "Outreach, subsequence, reply prompt, booking.",
      children: {
        outreach: { label: "Outreach", leaf: "emails_pre_close_outreach" },
        subsequence: { label: "Subsequence", leaf: "emails_pre_close_subsequence" },
        reply_prompt: { label: "Reply prompt", leaf: "emails_pre_close_reply_prompt" },
        booking: { label: "Booking", leaf: "emails_pre_close_booking" },
      },
    },
    close: {
      label: "CLOSE",
      caption: "Onboarding et notifications post-signature.",
      children: {
        onboarding: { label: "Onboarding", leaf: "emails_close_onboarding" },
        notifications: { label: "Notifications", leaf: "emails_close_notifications" },
      },
    },
  };
}

export const MODULES: Record<string, NavNode> = {
  sales: {
    label: "Sales",
    caption: "Funnel commercial et fiches mockup.",
    children: salesTree(),
  },
  onboarding: {
    label: "Onboarding",
    caption: "Parcours et création de fiches réelles.",
    children: onboardingTree(),
  },
  dashboard: {
    label: "Dashboard",
    caption: "KPIs funnel — à venir.",
    leaf: "dashboard",
  },
  legal: {
    label: "CVG & légal",
    caption: "Documents légaux par audience.",
    children: legalTree(),
  },
  emails: {
    label: "Emails",
    caption: "Workflows email PRE-CLOSE et CLOSE.",
    children: emailsTree(),
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
  const labels = ["Funnels"];
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
      labels.push(segment);
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

export function hubTitle(path: string[]): string {
  if (path.length === 1) {
    return "Choisissez un module";
  }
  if (path.length === 2) {
    return "Choisissez une section";
  }
  return "Choisissez une étape";
}
