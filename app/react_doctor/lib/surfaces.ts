import path from "node:path";

import type { Surface, SurfaceFilter, SurfaceInventory } from "../types.js";
import { EXCLUDE_GLOBS, REPO_ROOT } from "./constants.js";

function normalize(rel: string): string {
  return rel.replace(/\\/g, "/");
}

function matchGlob(rel: string, pattern: string): boolean {
  const normalized = normalize(rel);
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return normalized.startsWith(prefix) || normalized === prefix.replace(/\/$/, "");
  }
  if (pattern.startsWith("**/")) {
    const suffix = pattern.slice(3);
    return normalized.endsWith(suffix) || normalized.includes(`/${suffix}`);
  }
  return normalized === pattern;
}

export function isExcludedPath(relPath: string): boolean {
  const rel = normalize(relPath);
  return EXCLUDE_GLOBS.some((glob) => matchGlob(rel, glob));
}

export function classifySurface(relPath: string): Surface {
  const rel = normalize(relPath);

  if (isExcludedPath(rel)) return "excluded";
  if (
    rel.startsWith("app/internal/") ||
    rel.startsWith("components/internal/")
  ) {
    return "internal";
  }
  if (
    rel.startsWith("components/agence/") ||
    rel.startsWith("components/entreprise/") ||
    rel === "app/page.tsx" ||
    rel.startsWith("app/entreprise/")
  ) {
    return "marketing";
  }
  if (
    rel.startsWith("app/dashboard/") ||
    rel.startsWith("components/dashboard/")
  ) {
    return "dashboard";
  }
  if (rel.endsWith(".tsx") || rel.endsWith(".jsx")) {
    return "other";
  }
  return "excluded";
}

export function filterBySurface<T extends { surface: Surface }>(
  items: T[],
  surface: SurfaceFilter,
): T[] {
  if (surface === "all") return items.filter((item) => item.surface !== "excluded");
  return items.filter((item) => item.surface === surface);
}

export function resolveEffectiveSurface(
  cacheSurface: SurfaceFilter,
  requested: SurfaceFilter,
): SurfaceFilter {
  return requested === "all" ? cacheSurface : requested;
}

export function buildInventory(filePaths: string[]): SurfaceInventory {
  const inventory: SurfaceInventory = {
    internal: [],
    marketing: [],
    dashboard: [],
    other: [],
    excluded: [],
  };

  for (const filePath of filePaths) {
    const rel = normalize(path.relative(REPO_ROOT, filePath));
    const surface = classifySurface(rel);
    inventory[surface].push(rel);
  }

  for (const key of Object.keys(inventory) as (keyof SurfaceInventory)[]) {
    inventory[key].sort();
  }

  return inventory;
}
