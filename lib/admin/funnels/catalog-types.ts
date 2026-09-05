import { z } from "zod";

import { FORM_FIELD_IDS } from "@/lib/admin/funnels/schema";

export const DEFAULT_LAYOUT_ID = "default-split";

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
