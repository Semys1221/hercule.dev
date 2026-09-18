import type { InternalPageSegment } from "./internal-page-header";
import { PRODUCT_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";
import {
  MODULES,
  NICHE_LABELS,
  bookingsHref,
  clientsHubHref,
  emailsHref,
  legalHref,
  managementHref,
  sessionHubHref,
  type LegalDocSegment,
  type Niche,
} from "@/lib/admin/navigation";

const MODULE_LABELS: Record<string, string> = {
  session: MODULES.sales.label,
  bookings: MODULES.bookings.label,
  clients: MODULES.clients.label,
  management: MODULES.management.label,
  legal: "Legal",
  emails: "Emails",
};

const LEGAL_DOC_SEGMENT_LABELS: Record<LegalDocSegment, string> = {
  cgv: "CGV",
  mentions: "Mentions légales",
  confidentialite: "Confidentialité",
  faq: "FAQ",
  pricing: "Tarification",
};

function moduleHref(module: string, niche: Niche): string {
  switch (module) {
    case "session":
      return sessionHubHref(niche);
    case "bookings":
      return bookingsHref(niche);
    case "clients":
      return clientsHubHref(niche);
    case "management":
      return managementHref(niche);
    case "legal":
      return legalHref(niche);
    case "emails":
      return emailsHref(niche);
    default:
      return sessionHubHref(niche);
  }
}

export function segmentsFromModulePath(
  module: string,
  niche: Niche,
  doc?: LegalDocSegment,
): InternalPageSegment[] {
  const segments: InternalPageSegment[] = [
    { label: PRODUCT_ROOT_LABEL, href: "/internal/funnels" },
    {
      label: MODULE_LABELS[module] ?? module,
      href: moduleHref(module, niche),
    },
    { label: NICHE_LABELS[niche] },
  ];

  if (doc) {
    segments.splice(2, 0, {
      label: MODULE_LABELS.legal,
      href: legalHref(niche),
    });
    segments.push({ label: LEGAL_DOC_SEGMENT_LABELS[doc] });
  }

  const last = segments[segments.length - 1];
  if (last) {
    delete last.href;
  }

  return segments;
}

// Legacy audience-first breadcrumbs (old workspace routes)
import { SEGMENT_LABELS } from "@/lib/admin/funnels/ui-copy";
import {
  isNiche,
  pathToHref,
  type NavNode,
} from "@/lib/admin/navigation";
import { getEmailSequence } from "@/lib/admin/email-sequences/registry";

export function segmentsFromNavPath(path: string[]): InternalPageSegment[] {
  const segments: InternalPageSegment[] = [
    { label: PRODUCT_ROOT_LABEL, href: "/internal/funnels" },
  ];

  if (path.length === 0) {
    return segments;
  }

  const audience = path[0];
  if (isNiche(audience)) {
    segments.push({
      label: NICHE_LABELS[audience],
      href: pathToHref([audience]),
    });
  } else {
    segments.push({ label: audience });
  }

  let currentChildren: Record<string, NavNode> = MODULES;
  const builtPath = [audience];

  for (const segment of path.slice(1)) {
    builtPath.push(segment);
    const node = currentChildren[segment];
    if (!node) {
      const sequence = getEmailSequence(segment);
      if (sequence) {
        segments.push({ label: sequence.name });
        break;
      }
      segments.push({ label: SEGMENT_LABELS[segment] ?? segment });
      break;
    }
    segments.push({
      label: node.label,
      href: pathToHref(builtPath),
    });
    currentChildren = node.children ?? {};
  }

  const last = segments[segments.length - 1];
  if (last) {
    delete last.href;
  }

  return segments;
}
