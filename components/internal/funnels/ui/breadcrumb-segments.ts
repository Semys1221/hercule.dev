import {
  AUDIENCE_LABELS,
  MODULES,
  isAudience,
  pathToHref,
} from "@/lib/admin/navigation";

import type { InternalPageSegment } from "./internal-page-header";

export function segmentsFromNavPath(path: string[]): InternalPageSegment[] {
  const segments: InternalPageSegment[] = [
    { label: "Funnels", href: "/internal/funnels" },
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

  let currentChildren: Record<string, { label: string; children?: Record<string, unknown> }> =
    MODULES;
  const builtPath = [audience];

  for (const segment of path.slice(1)) {
    builtPath.push(segment);
    const node = currentChildren[segment];
    if (!node) {
      segments.push({ label: segment });
      break;
    }
    segments.push({
      label: node.label,
      href: pathToHref(builtPath),
    });
    currentChildren = (node.children ?? {}) as typeof currentChildren;
  }

  const last = segments[segments.length - 1];
  if (last) {
    delete last.href;
  }

  return segments;
}
