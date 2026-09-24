import { z } from "zod";

const verticalSchema = z.object({
  routeSegment: z.string().min(1),
  comptableDeliverySegment: z.string().min(1),
  instantlyCampaignId: z.string().uuid(),
  calendlySchedulingUrl: z.string().url(),
  enabled: z.boolean(),
});

export const clientBookingConfigSchema = z.object({
  clientKey: z.string().min(1),
  clientId: z.string().uuid(),
  clientEmail: z.string().email(),
  verticals: z.record(z.string(), verticalSchema),
});

export type ClientBookingConfig = z.infer<typeof clientBookingConfigSchema>;
export type ClientBookingVerticalConfig = z.infer<typeof verticalSchema>;
