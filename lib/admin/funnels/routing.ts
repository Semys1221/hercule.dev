import { notFound } from "next/navigation";

import {
  FUNNEL_LIST_LEAF_KEYS,
  scopeFromLeafKey,
} from "@/lib/admin/funnels/schema";
import {
  isAudience,
  leafKey,
  normalizePath,
  pathToHref,
  type Audience,
} from "@/lib/admin/navigation";

export type ParsedWorkspacePath =
  | {
      kind: "hub";
      navPath: string[];
    }
  | {
      kind: "leaf";
      navPath: string[];
      leafKey: string;
      funnelSlug: null;
    }
  | {
      kind: "funnel_editor";
      navPath: string[];
      leafKey: string;
      funnelSlug: string;
    };

export function parseWorkspacePath(
  audience: string,
  rawPath: string[] = [],
): ParsedWorkspacePath {
  if (!isAudience(audience)) {
    notFound();
  }

  const navPath = normalizePath([audience, ...rawPath]);
  const key = leafKey(navPath);

  if (!key) {
    return { kind: "hub", navPath };
  }

  const navSegments = navPath.slice(1);
  const extraCount = rawPath.length - navSegments.length;

  if (!FUNNEL_LIST_LEAF_KEYS.has(key)) {
    if (extraCount > 0) {
      notFound();
    }
    return { kind: "leaf", navPath, leafKey: key, funnelSlug: null };
  }

  if (extraCount === 0) {
    return { kind: "leaf", navPath, leafKey: key, funnelSlug: null };
  }

  if (extraCount === 1) {
    const funnelSlug = rawPath[rawPath.length - 1] ?? "";
    return {
      kind: "funnel_editor",
      navPath,
      leafKey: key,
      funnelSlug,
    };
  }

  notFound();
}

export function funnelEditorHref(
  navPath: string[],
  funnelSlug: string,
  query?: Record<string, string>,
): string {
  const base = pathToHref([...navPath, funnelSlug]);
  if (!query || Object.keys(query).length === 0) {
    return base;
  }
  const params = new URLSearchParams(query);
  return `${base}?${params.toString()}`;
}

export function funnelListHref(navPath: string[]): string {
  return pathToHref(navPath);
}

export function scopeForParsedLeaf(audience: Audience, parsedLeafKey: string) {
  return scopeFromLeafKey(parsedLeafKey, audience);
}
