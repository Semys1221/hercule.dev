import { SLIDER_CONFIGS } from "@/components/internal/funnels/sales/sales-questions";
import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import { SEED_PREFIX } from "@/lib/admin/clients/seed";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import type { DashboardFormData } from "@/lib/dashboard/types";
import { E2E_TEST_EMAIL } from "@/lib/test/e2e-identity";

export const SALES_TEST_SESSION_EMAIL = E2E_TEST_EMAIL;

export const SALES_TEST_SESSION_SLUG = `${SEED_PREFIX}sales-session`;

export const SALES_TEST_SESSION_INVITEE_URI =
  "https://api.calendly.com/scheduled_events/test-session/invitees/sales-funnel";

export const SALES_TEST_SESSION_FIRST_NAME = "Test";

export const SALES_TEST_SESSION_COMPANY = "Agence Test Hercule";

export const SALES_TEST_SESSION_CALENDLY_QUESTIONS: Record<string, string> = {
  "Combien de personnes composent votre équipe ?": "4 collaborateurs",
  "Quelles sont vos principales activités ?": "Google Ads, SEO et création web",
  "Votre produit d'appel démarre-t-il à plus de 1 500 € ?": "Oui, plus de 1 500 €",
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

export function isSalesTestSessionSlug(slug: string): boolean {
  return slug === SALES_TEST_SESSION_SLUG;
}
