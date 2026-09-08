import { z } from "zod";

export const salesSessionSettingsAudienceSchema = z.enum(["agence", "entreprise", "comptable"]);

export const salesSessionSettingsDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  audience: salesSessionSettingsAudienceSchema,
  updatedAt: z.string().datetime(),
  preparation: z.object({
    content: z.string(),
  }),
  waitingQueue: z.object({
    enabled: z.boolean(),
  }),
});

export type SalesSessionSettingsDocument = z.infer<typeof salesSessionSettingsDocumentSchema>;
