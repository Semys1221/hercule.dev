import { readFileSync } from "node:fs";
import { join } from "node:path";

import { z } from "zod";

import { FORM_FIELD_IDS } from "@/lib/admin/funnels/schema";

const SYSTEM_DIR = join(process.cwd(), "content", "funnels", "_system");

export const layoutCatalogEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  componentPath: z.string(),
  previewKey: z.string(),
});

export const layoutsCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  layouts: z.array(layoutCatalogEntrySchema),
});

export const presetCatalogEntrySchema = z.object({
  id: z.enum(["question", "form", "other"]),
  label: z.string(),
  description: z.string(),
  previewKey: z.string(),
  sharedComponentPath: z.string().nullable(),
});

export const presetsCatalogSchema = z.object({
  schemaVersion: z.literal(1),
  presets: z.array(presetCatalogEntrySchema),
  formFieldCatalog: z.array(
    z.object({
      id: z.enum(FORM_FIELD_IDS),
      label: z.string(),
    }),
  ),
});

export type LayoutCatalogEntry = z.infer<typeof layoutCatalogEntrySchema>;
export type PresetCatalogEntry = z.infer<typeof presetCatalogEntrySchema>;
export type FunnelCatalog = {
  layouts: LayoutCatalogEntry[];
  presets: PresetCatalogEntry[];
  formFieldCatalog: z.infer<typeof presetsCatalogSchema>["formFieldCatalog"];
};

function readJsonFile<T>(filename: string, schema: z.ZodType<T>): T {
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

export const DEFAULT_LAYOUT_ID = "default-split";
