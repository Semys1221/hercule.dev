import { z } from "zod";

import type { Audience } from "@/lib/admin/navigation";
import { faqEntrySchema } from "@/lib/site/faq-types";
import { pricingComponentConfigSchema } from "@/lib/site/pricing-types";

export const FUNNEL_SCHEMA_VERSION = 1;

export const cursorImpactSchema = z.enum(["light", "medium", "high"]);
export type CursorImpact = z.infer<typeof cursorImpactSchema>;

export const funnelStatusSchema = z.enum(["draft", "published"]);
export type FunnelStatus = z.infer<typeof funnelStatusSchema>;

export const funnelKindSchema = z.enum(["vente", "onboarding"]);
export type FunnelKind = z.infer<typeof funnelKindSchema>;

export const venteStageSchema = z.enum(["discovery", "pitch", "closing"]);
export type VenteStage = z.infer<typeof venteStageSchema>;

export const stepPresetSchema = z.enum(["question", "form", "other"]);
export type StepPreset = z.infer<typeof stepPresetSchema>;

export const FORM_FIELD_IDS = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "company",
  "role",
  "message",
] as const;

export type FormFieldId = (typeof FORM_FIELD_IDS)[number];

export const funnelSlugSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_-]*$/);

export const displayNameSchema = z.string().min(1).max(120);

export const stepAnswerSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
});

export const questionStepContentSchema = z.object({
  prompt: z.string().min(1).max(500),
  answers: z.array(stepAnswerSchema).min(1).max(6),
  selection: z.literal("multiple"),
});

export const formFieldConfigSchema = z.object({
  id: z.enum(FORM_FIELD_IDS),
  enabled: z.boolean(),
  required: z.boolean(),
});

export const formStepContentSchema = z.object({
  fields: z.array(formFieldConfigSchema),
});

export const otherStepContentSchema = z.object({
  intent: z.string().min(1).max(2000),
});

export const faqComponentConfigSchema = z.object({
  id: z.string().min(1),
  hiddenIds: z.array(z.string()).default([]),
  localEntries: z.array(faqEntrySchema).default([]),
});

export const stepComponentsSchema = z.object({
  faq: z.array(faqComponentConfigSchema).max(2).optional(),
  pricing: pricingComponentConfigSchema.optional(),
});

export type FaqComponentConfig = z.infer<typeof faqComponentConfigSchema>;
export type StepComponents = z.infer<typeof stepComponentsSchema>;

export const stepContextSchema = z.object({
  audience: z.enum(["agence", "entreprise"]),
  kind: funnelKindSchema,
  stage: venteStageSchema.nullable(),
  layoutId: z.string().nullable(),
  previousSteps: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
    }),
  ),
});

export const funnelStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(0),
  name: z.string().min(1).max(120),
  description: z.string().min(1).max(500),
  preset: stepPresetSchema.nullable(),
  cursorImpact: cursorImpactSchema.default("medium"),
  command: z.string().optional(),
  context: stepContextSchema.optional(),
  question: questionStepContentSchema.optional(),
  form: formStepContentSchema.optional(),
  other: otherStepContentSchema.optional(),
  components: stepComponentsSchema.optional(),
});

export const funnelDocumentSchema = z.object({
  schemaVersion: z.literal(FUNNEL_SCHEMA_VERSION),
  slug: funnelSlugSchema,
  displayName: displayNameSchema,
  audience: z.enum(["agence", "entreprise"]),
  kind: funnelKindSchema,
  stage: venteStageSchema.nullable(),
  status: funnelStatusSchema,
  layoutId: z.string().nullable(),
  publicPath: z.string().min(1),
  steps: z.array(funnelStepSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type FunnelDocument = z.infer<typeof funnelDocumentSchema>;
export type FunnelStep = z.infer<typeof funnelStepSchema>;

export const createFunnelBodySchema = z.object({
  audience: z.enum(["agence", "entreprise"]),
  kind: funnelKindSchema,
  stage: venteStageSchema.nullable().optional(),
  displayName: displayNameSchema.optional(),
});

export const listFunnelsQuerySchema = z.object({
  audience: z.enum(["agence", "entreprise"]),
  kind: funnelKindSchema,
  stage: venteStageSchema.nullable().optional(),
});

export const funnelSummarySchema = z.object({
  slug: funnelSlugSchema,
  displayName: displayNameSchema,
  status: funnelStatusSchema,
  updatedAt: z.string().datetime(),
  stepCount: z.number().int().min(0),
});

export type FunnelSummary = z.infer<typeof funnelSummarySchema>;

export const patchFunnelBodySchema = funnelDocumentSchema
  .omit({
    schemaVersion: true,
    slug: true,
    audience: true,
    kind: true,
    stage: true,
    publicPath: true,
    createdAt: true,
  })
  .partial()
  .extend({
    steps: z.array(funnelStepSchema).optional(),
  });

export const editTicketKindSchema = z.enum(["layout", "component"]);
export type EditTicketKind = z.infer<typeof editTicketKindSchema>;

export const editTicketStatusSchema = z.enum(["pending", "applied"]);
export type EditTicketStatus = z.infer<typeof editTicketStatusSchema>;

export const editTicketSchema = z.object({
  schemaVersion: z.literal(FUNNEL_SCHEMA_VERSION),
  id: z.string().min(1),
  kind: editTicketKindSchema,
  status: editTicketStatusSchema,
  createdAt: z.string().datetime(),
  funnelRef: z.object({
    audience: z.enum(["agence", "entreprise"]),
    kind: funnelKindSchema,
    stage: venteStageSchema.nullable(),
    slug: funnelSlugSchema,
  }),
  target: z
    .object({
      componentPath: z.string().nullable(),
    })
    .optional(),
  command: z.string().min(1).max(5000),
  cursorImpact: cursorImpactSchema,
  designTokens: z.record(z.string(), z.string()),
  constraints: z.array(z.string()),
});

export type EditTicket = z.infer<typeof editTicketSchema>;

export const createEditTicketBodySchema = z.object({
  audience: z.enum(["agence", "entreprise"]),
  kind: funnelKindSchema,
  stage: venteStageSchema.nullable().optional(),
  funnelSlug: funnelSlugSchema,
  ticketKind: editTicketKindSchema,
  componentPath: z.string().nullable().optional(),
  command: z.string().min(1).max(5000),
  cursorImpact: cursorImpactSchema.default("medium"),
});

export type FunnelScope = {
  audience: Audience;
  kind: FunnelKind;
  stage: VenteStage | null;
};

export function publicPathForScope(scope: FunnelScope): string {
  if (scope.kind === "onboarding") {
    return `/onboarding/${scope.audience}`;
  }
  return `/vente/${scope.audience}/${scope.stage}`;
}

export function scopeFromLeafKey(leafKey: string, audience: Audience): FunnelScope | null {
  const stageByLeaf: Record<string, VenteStage> = {
    sales_funnel_discovery: "discovery",
    sales_funnel_pitch: "pitch",
    sales_funnel_closing: "closing",
  };

  if (leafKey in stageByLeaf) {
    return {
      audience,
      kind: "vente",
      stage: stageByLeaf[leafKey],
    };
  }

  if (leafKey === "onboarding_funnel") {
    return {
      audience,
      kind: "onboarding",
      stage: null,
    };
  }

  return null;
}

export const FUNNEL_LIST_LEAF_KEYS = new Set([
  "sales_funnel_discovery",
  "sales_funnel_pitch",
  "sales_funnel_closing",
  "onboarding_funnel",
]);

export function defaultFormFields(): z.infer<typeof formStepContentSchema>["fields"] {
  return FORM_FIELD_IDS.map((id) => ({
    id,
    enabled: ["firstName", "email", "company"].includes(id),
    required: ["firstName", "email"].includes(id),
  }));
}
