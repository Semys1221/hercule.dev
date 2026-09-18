import { z } from "zod";

export const propositionTenantSchema = z.enum(["comptable", "agence", "cif"]);

export const propositionProspectSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email().optional(),
});

export const propositionRecapItemSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const propositionRecapSlideSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  paragraphs: z.array(z.string().min(1)).min(1),
  items: z.array(propositionRecapItemSchema).optional(),
  confirmLabel: z.string().min(1).optional(),
  visual: z.string().optional(),
});

export const propositionBlockSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1),
  visual: z.string().optional(),
});

export const propositionRoiSlidersSchema = z.object({
  prospectsDefault: z.number().int().min(1),
  prospectsMin: z.number().int().min(1).optional(),
  prospectsMax: z.number().int().min(1).optional(),
  honoraireDefault: z.number().int().min(1),
  honoraireMin: z.number().int().min(1).optional(),
  honoraireMax: z.number().int().min(1).optional(),
});

export const propositionRoiSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  details: z.array(z.string().min(1)).min(1),
  sliders: propositionRoiSlidersSchema.optional(),
});

export const propositionPricingOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  amountLabel: z.string().min(1),
  details: z.array(z.string().min(1)).min(1),
  stripePaymentLinkUrl: z.string().url(),
  recommended: z.boolean().optional(),
});

export const propositionPricingSchema = z.object({
  title: z.string().min(1),
  amountLabel: z.string().min(1),
  details: z.array(z.string().min(1)).min(1),
  options: z.array(propositionPricingOptionSchema).optional(),
});

export const propositionPaymentSchema = z.object({
  stripePaymentLinkUrl: z.string().url(),
});

export const propositionConfigSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().min(1),
  label: z.string().min(1),
  pageTitle: z.string().min(1).optional(),
  tenant: propositionTenantSchema,
  prospect: propositionProspectSchema,
  recap: z.array(propositionRecapSlideSchema).min(1),
  proposal: z.object({
    blocks: z.array(propositionBlockSchema).min(1),
    roi: propositionRoiSchema,
    pricing: propositionPricingSchema,
  }),
  payment: propositionPaymentSchema,
});

export type PropositionTenant = z.infer<typeof propositionTenantSchema>;
export type PropositionProspect = z.infer<typeof propositionProspectSchema>;
export type PropositionRecapSlide = z.infer<typeof propositionRecapSlideSchema>;
export type PropositionBlock = z.infer<typeof propositionBlockSchema>;
export type PropositionRoiSliders = z.infer<typeof propositionRoiSlidersSchema>;
export type PropositionRoi = z.infer<typeof propositionRoiSchema>;
export type PropositionPricingOption = z.infer<typeof propositionPricingOptionSchema>;
export type PropositionPricing = z.infer<typeof propositionPricingSchema>;
export type PropositionPayment = z.infer<typeof propositionPaymentSchema>;
export type PropositionConfig = z.infer<typeof propositionConfigSchema>;

export function parsePropositionConfig(raw: unknown): PropositionConfig {
  return propositionConfigSchema.parse(raw);
}
