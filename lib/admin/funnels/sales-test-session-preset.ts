import { SLIDER_CONFIGS } from "@/components/internal/funnels/sales/sales-questions";
import { COMPTABLE_SLIDER_CONFIGS } from "@/components/internal/funnels/sales/sales-questions-comptable";
import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import { SEED_PREFIX } from "@/lib/admin/clients/seed";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { isComptableSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { DashboardFormData } from "@/lib/dashboard/types";
import { E2E_TEST_EMAIL } from "@/lib/test/e2e-identity";

export const SALES_TEST_SESSION_EMAIL = E2E_TEST_EMAIL;

export const SALES_TEST_SESSION_SLUG = `${SEED_PREFIX}sales-session`;

export const SALES_TEST_SESSION_COMPTABLE_SLUG = `${SEED_PREFIX}sales-session-comptable`;

export const SALES_TEST_SESSION_INVITEE_URI =
  "https://api.calendly.com/scheduled_events/test-session/invitees/sales-funnel";

export const SALES_TEST_SESSION_COMPTABLE_INVITEE_URI =
  "https://api.calendly.com/scheduled_events/test-session-comptable/invitees/sales-funnel";

export const SALES_TEST_SESSION_FIRST_NAME = "Test";

export const SALES_TEST_SESSION_COMPANY = "Agence Test Hercule";

export const SALES_TEST_SESSION_COMPTABLE_COMPANY = "Cabinet Test Hercule EC";

export const SALES_TEST_SESSION_CALENDLY_QUESTIONS: Record<string, string> = {
  "Combien de personnes composent votre équipe ?": "4 collaborateurs",
  "Quelles sont vos principales activités ?": "Google Ads, SEO et création web",
  "Votre produit d'appel démarre-t-il à plus de 1 500 € ?": "Oui, plus de 1 500 €",
};

export const SALES_TEST_SESSION_COMPTABLE_CALENDLY_QUESTIONS: Record<string, string> = {
  "Combien d'associés ou collaborateurs compte votre cabinet ?": "5 collaborateurs",
  "Quelles missions proposez-vous ?": "Tenue comptable, fiscal et social",
  "Votre formule démarre-t-elle à 1 499 € / mois ?": "Oui, compatible 1 499 €",
};

export const SALES_TEST_SESSION_QUALIFICATION: SalesQualificationValues = {
  introConfirmed: true,
  presentationConfirmed: true,
  q1: ["google_ads", "seo", "web_creation"],
  q2: ["paid_acquisition", "organic_seo"],
  q2Other: "",
  q3: 8,
  q4: "high",
  q5: "2_5_days",
  q6: 1,
  q7: 0,
  q8: ["none"],
  q9: "freelance",
  q10: "all",
  q11: ["pme_small", "pme_medium"],
  q12: "intermediate",
  q13: 2000,
  q14: {
    months3: SLIDER_CONFIGS.monthlyMin.defaultValue,
    months6: SLIDER_CONFIGS.monthlyMin.defaultValue,
    months12: SLIDER_CONFIGS.monthlyMin.defaultValue,
  },
  q15: 2500,
  q16: SLIDER_CONFIGS.paidAdsDuration.defaultValue,
  q17: SLIDER_CONFIGS.monthlyMin.defaultValue,
  q18: SLIDER_CONFIGS.seoDuration.defaultValue,
  q19: ["acquisition", "seo", "recurring"],
  q20: 5,
};

export const SALES_TEST_SESSION_COMPTABLE_QUALIFICATION: SalesQualificationValues = {
  ...SALES_TEST_SESSION_QUALIFICATION,
  q1: ["google_ads", "seo", "web_creation"],
  q2: ["paid_acquisition", "organic_seo"],
  q13: 2000,
  q14: {
    months3: COMPTABLE_SLIDER_CONFIGS.monthlyMin.defaultValue,
    months6: COMPTABLE_SLIDER_CONFIGS.monthlyMin.defaultValue,
    months12: COMPTABLE_SLIDER_CONFIGS.monthlyMin.defaultValue,
  },
  q15: 1800,
  q17: COMPTABLE_SLIDER_CONFIGS.monthlyMin.defaultValue,
  q19: ["recurring", "acquisition", "seo"],
};

export const SALES_TEST_SESSION_CLOSING: SalesClosingValues = {
  reglesAccepted: true,
  calendrierAccepted: true,
};

export const SALES_TEST_SESSION_PROFILE_FORM: DashboardFormData = {
  specialites: ["Branding", "SEO", "Google Ads"],
  zone: "France entière",
  capacite: 4,
  budgetMinPonctuel: 8000,
  budgetMinMensuel: 2500,
};

export type SalesTestSessionPreset = {
  slug: string;
  inviteeUri: string;
  company: string;
  calendlyQuestions: Record<string, string>;
  qualification: SalesQualificationValues;
  closing: SalesClosingValues;
  profileForm: DashboardFormData;
  leadCategory: LeadCategory;
};

export function getSalesTestSessionPreset(audience: Audience): SalesTestSessionPreset {
  if (isComptableSalesAudience(audience)) {
    return {
      slug: SALES_TEST_SESSION_COMPTABLE_SLUG,
      inviteeUri: SALES_TEST_SESSION_COMPTABLE_INVITEE_URI,
      company: SALES_TEST_SESSION_COMPTABLE_COMPANY,
      calendlyQuestions: SALES_TEST_SESSION_COMPTABLE_CALENDLY_QUESTIONS,
      qualification: SALES_TEST_SESSION_COMPTABLE_QUALIFICATION,
      closing: SALES_TEST_SESSION_CLOSING,
      profileForm: {},
      leadCategory: "comptable",
    };
  }

  return {
    slug: SALES_TEST_SESSION_SLUG,
    inviteeUri: SALES_TEST_SESSION_INVITEE_URI,
    company: SALES_TEST_SESSION_COMPANY,
    calendlyQuestions: SALES_TEST_SESSION_CALENDLY_QUESTIONS,
    qualification: SALES_TEST_SESSION_QUALIFICATION,
    closing: SALES_TEST_SESSION_CLOSING,
    profileForm: SALES_TEST_SESSION_PROFILE_FORM,
    leadCategory: "agence",
  };
}

export function isSalesTestSessionSlug(slug: string): boolean {
  return slug === SALES_TEST_SESSION_SLUG || slug === SALES_TEST_SESSION_COMPTABLE_SLUG;
}

export function salesTestSessionSlugForAudience(audience: Audience): string {
  return getSalesTestSessionPreset(audience).slug;
}
