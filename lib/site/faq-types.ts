import { z } from "zod";

export const faqAudienceSchema = z.enum(["agence", "entreprise", "comptable", "cif", "jum", "assurance"]);
export type FaqAudience = z.infer<typeof faqAudienceSchema>;

export const faqEntrySchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  cvgLink: z.boolean().optional(),
  /** Shown on paid client dashboard (`/clients/[slug]`). */
  paidClient: z.boolean().optional(),
  /** Sort order among paid-client entries (ascending). */
  paidClientOrder: z.number().int().positive().optional(),
});

export type FaqEntry = z.infer<typeof faqEntrySchema>;

export const faqDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  audience: faqAudienceSchema,
  updatedAt: z.string().datetime(),
  entries: z.array(faqEntrySchema),
});

export type FaqDocument = z.infer<typeof faqDocumentSchema>;

export const faqComponentConfigSchema = z.object({
  id: z.string().min(1),
  hiddenIds: z.array(z.string()).default([]),
  localEntries: z.array(faqEntrySchema).default([]),
});

export type FaqComponentConfig = z.infer<typeof faqComponentConfigSchema>;
