import { SEGMENT_LABELS, PRODUCT_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";
import {
  AUDIENCE_LABELS,
  MODULES,
  isAudience,
  pathToHref,
  type Audience,
  type NavNode,
} from "@/lib/admin/navigation";
import {
  getEmailSequence,
} from "@/lib/admin/email-sequences/registry";

import type { InternalPageSegment } from "./internal-page-header";

export function segmentsFromNavPath(path: string[]): InternalPageSegment[] {
  const segments: InternalPageSegment[] = [
    { label: PRODUCT_ROOT_LABEL, href: "/internal/funnels" },
  ];

  if (path.length === 0) {
    return segments;
  }

  const audience = path[0];
  if (isAudience(audience)) {
    segments.push({
      label: AUDIENCE_LABELS[audience],
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
