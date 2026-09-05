import { z } from "zod";

export const pricingAudienceSchema = z.enum(["agence", "entreprise"]);
export type PricingAudience = z.infer<typeof pricingAudienceSchema>;

export const pricingPlanSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  label: z.string().min(1),
  price: z.string().min(1),
  priceSuffix: z.string().nullable(),
  tagline: z.string().min(1),
  summary: z.string().nullable(),
  footer: z.string().nullable(),
  featured: z.boolean(),
  profileOnly: z.boolean(),
  highlight: z.string().nullable(),
  features: z.array(z.string().min(1)),
});

export type PricingPlan = z.infer<typeof pricingPlanSchema>;

export const pricingGuaranteeSectionSchema = z.object({
  title: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export const pricingHeroSchema = z.object({
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  intro: z.string().min(1),
});

export const pricingDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  audience: z.literal("agence"),
  updatedAt: z.string().datetime(),
  hero: pricingHeroSchema,
  plans: z.array(pricingPlanSchema).min(1),
  gatedTeaserFeatures: z.array(z.string().min(1)),
  gatedGhostFeatures: z.array(z.string().min(1)),
  guaranteeSection: pricingGuaranteeSectionSchema,
});

export type PricingDocument = z.infer<typeof pricingDocumentSchema>;

export const pricingComponentConfigSchema = z.object({
  id: z.string().min(1),
  hiddenPlanIds: z.array(z.string()).optional(),
});

export type PricingComponentConfig = z.infer<typeof pricingComponentConfigSchema>;
