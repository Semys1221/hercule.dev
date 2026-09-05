import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  DEFAULT_LAYOUT_ID,
  layoutsCatalogSchema,
  presetsCatalogSchema,
  type FunnelCatalog,
  type LayoutCatalogEntry,
} from "@/lib/admin/funnels/catalog-types";

export {
  DEFAULT_LAYOUT_ID,
  layoutCatalogEntrySchema,
  layoutsCatalogSchema,
  presetCatalogEntrySchema,
  presetsCatalogSchema,
  type FunnelCatalog,
  type LayoutCatalogEntry,
  type PresetCatalogEntry,
} from "@/lib/admin/funnels/catalog-types";

const SYSTEM_DIR = join(process.cwd(), "content", "funnels", "_system");

function readJsonFile<T>(filename: string, schema: import("zod").ZodType<T>): T {
  const raw = readFileSync(join(SYSTEM_DIR, filename), "utf8");
  return schema.parse(JSON.parse(raw));
}

export function getLayoutsCatalog(): LayoutCatalogEntry[] {
  const catalog = readJsonFile("layouts-catalog.json", layoutsCatalogSchema);
  return catalog.layouts;
}

export function getPresetsCatalog(): FunnelCatalog {
  const presets = readJsonFile("presets-catalog.json", presetsCatalogSchema);
  return {
    layouts: getLayoutsCatalog(),
    presets: presets.presets,
    formFieldCatalog: presets.formFieldCatalog,
  };
}

export function getLayoutById(layoutId: string): LayoutCatalogEntry | undefined {
  return getLayoutsCatalog().find((entry) => entry.id === layoutId);
}
