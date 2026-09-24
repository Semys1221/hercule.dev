import { z } from "zod";

export const funnelPhaseSchema = z.enum(["pre_booking", "post_booking"]);
export type FunnelPhase = z.infer<typeof funnelPhaseSchema>;

export const stepKindSchema = z.enum([
  "intro",
  "single_choice",
  "education",
  "free_text",
  "calendly",
  "confirmation",
  "checklist",
]);
export type StepKind = z.infer<typeof stepKindSchema>;

export const funnelStepIdSchema = z.enum([
  "intro",
  "profitability",
  "visibility",
  "accountant_situation",
  "intention",
  "education",
  "projection",
  "budget",
  "engagement",
  "calendly",
  "confirmation",
  "annual_revenue",
  "team_size",
  "meeting_priority",
  "free_text_problem",
  "mental_prep",
  "final_intention",
  "final_prep",
]);
export type FunnelStepId = z.infer<typeof funnelStepIdSchema>;

export type FunnelAnswers = Partial<Record<FunnelStepId, string>>;

export const funnelRouteSegmentSchema = z.enum([
  "restaurant",
  "btp",
  "chirurgien-dentiste",
]);
export type FunnelRouteSegment = z.infer<typeof funnelRouteSegmentSchema>;

export const qualificationUpsertSchema = z.object({
  slug: z.string().min(1),
  routeSegment: funnelRouteSegmentSchema,
  phase: funnelPhaseSchema,
  currentStepId: funnelStepIdSchema,
  answers: z.record(z.string(), z.string()),
  preBookingCompletedAt: z.string().datetime().nullable().optional(),
  bookedAt: z.string().datetime().nullable().optional(),
  postBookingCompletedAt: z.string().datetime().nullable().optional(),
});

export type QualificationUpsertPayload = z.infer<typeof qualificationUpsertSchema>;

export const qualificationRecordSchema = qualificationUpsertSchema.extend({
  comptableDeliveryId: z.string().uuid(),
  updatedAt: z.string().datetime(),
});

export type QualificationRecord = z.infer<typeof qualificationRecordSchema>;
