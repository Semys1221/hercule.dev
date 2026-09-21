import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

import type { PaymentOnboardingVertical } from "./constants";

export type StartPaymentOnboardingParams = {
  vertical: PaymentOnboardingVertical;
  recipientEmail: string;
  paymentAt: Date;
  stripeCheckoutSessionId: string;
  leadId: string;
  leadCategory: LeadCategory;
  dashboardLink?: string;
  estimatedFirstRdvDate?: string;
};

export type StartPaymentOnboardingResult = {
  welcomeSent: boolean;
  scheduledJobs: number;
};

export type PaymentOnboardingSequenceStep = {
  id: string;
  label?: string;
  delay?: string;
  subject: string;
  emailType: string;
  body: string;
  bodyFormat?: "text" | "html";
};

export type PaymentOnboardingSequenceDocument = {
  slug: string;
  vertical: PaymentOnboardingVertical;
  niche: string;
  stopOnReply: boolean;
  stopTriggers: string[];
  steps: PaymentOnboardingSequenceStep[];
};
