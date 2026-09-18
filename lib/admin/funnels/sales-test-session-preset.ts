import { SLIDER_CONFIGS } from "@/components/internal/funnels/sales/sales-questions";
import { COMPTABLE_SLIDER_CONFIGS } from "@/components/internal/funnels/sales/sales-questions-comptable";
import { CIF_SLIDER_CONFIGS } from "@/components/internal/funnels/sales/sales-questions-cif";
import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import { SEED_PREFIX } from "@/lib/admin/clients/seed";
import {
  SALES_SKIP_VALUE,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";
import { isComptableSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { DashboardFormData } from "@/lib/dashboard/types";
import { E2E_TEST_EMAIL } from "@/lib/test/e2e-identity";

export const SALES_TEST_SESSION_EMAIL = E2E_TEST_EMAIL;

export const SALES_TEST_SESSION_SLUG = `${SEED_PREFIX}sales-session`;

export const SALES_TEST_SESSION_COMPTABLE_SLUG = `${SEED_PREFIX}sales-session-comptable`;

export const SALES_TEST_SESSION_COMPTABLE_COMPANY = "Cabinet Test Hercule Comptable";

export const SALES_TEST_SESSION_INVITEE_URI =
  "https://api.calendly.com/scheduled_events/test-session/invitees/sales-funnel";

export const SALES_TEST_SESSION_COMPTABLE_INVITEE_URI =
  "https://api.calendly.com/scheduled_events/test-session-comptable/invitees/sales-funnel";

export const SALES_TEST_SESSION_FIRST_NAME = "Test";

export const SALES_TEST_SESSION_COMPANY = "Agence Test Hercule";

export const SALES_TEST_SESSION_CIF_SLUG = `${SEED_PREFIX}sales-session-cif`;

export const SALES_TEST_SESSION_CIF_INVITEE_URI =
  "https://api.calendly.com/scheduled_events/test-session-cif/invitees/sales-funnel";

export const SALES_TEST_SESSION_CIF_COMPANY = "Cabinet Test Hercule CIF";

export const SALES_TEST_SESSION_CIF_CALENDLY_QUESTIONS: Record<string, string> = {
  "Combien d'associés ou collaborateurs compte votre cabinet ?": "4 collaborateurs",
  "Quelles missions proposez-vous ?": "Optimisation fiscale et trésorerie",
  "Votre formule démarre-t-elle à 2 199 € / mois ?": "Oui, compatible 2 199 €",
};

export const SALES_TEST_SESSION_CALENDLY_QUESTIONS: Record<string, string> = {
  "Combien de personnes composent votre équipe ?": "4 collaborateurs",
  "Quelles sont vos principales activités ?": "Google Ads, SEO et création web",
  "Votre produit d'appel démarre-t-il à plus de 1 500 € ?": "Oui, plus de 1 500 €",
};

export const SALES_TEST_SESSION_COMPTABLE_CALENDLY_QUESTIONS: Record<string, string> = {
  "Combien d'associés ou collaborateurs compte votre cabinet ?": "5 collaborateurs",
  "Quelles missions proposez-vous ?": "Tenue comptable, fiscal et social",
  "Votre formule démarre-t-elle à 2 199 € / mois ?": "Oui, compatible 2 199 €",
};

export const SALES_TEST_SESSION_QUALIFICATION: SalesQualificationValues = {
  introConfirmed: true,
  presentationConfirmed: true,
  o1: ["qualified_leads", "bench_time"],
  o2: "high",
  o3: "insufficient_leads",
  o3FollowUp: "",
  o4: ["no_prospecting", "weak_channels"],
  o5: ["direct_prospecting", "paid_ads"],
  o6: "significant_gap",
  o3Duration: "6m",
  bleedDiagnosticAccepted: true,
  q1: ["google_ads", "seo", "web_creation"],
  q2: ["paid_acquisition", "organic_seo"],
  q2Other: "",
  q3: 8,
  q11: ["freelancers", "tpe"],
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
  q21: [],
};

export const SALES_TEST_SESSION_COMPTABLE_QUALIFICATION: SalesQualificationValues = {
  ...SALES_TEST_SESSION_QUALIFICATION,
  o1: [],
  o2: "",
  o3: "",
  o4: [],
  o5: [],
  o6: "",
  o3FollowUp: "",
  b1: "more_dossiers",
  b2: 4,
  b3: "y2020",
  b3Year: 2020,
  b4: 8,
  b5: ["word_of_mouth"],
  b6Acknowledged: true,
  b7: "wom_scale",
  b8: "significant_gap",
  bleedDiagnosticAccepted: true,
  q11: ["freelancers", "tpe"],
  q1: ["google_ads", "seo", "web_creation"],
  q2: ["paid_acquisition", "organic_seo"],
  q13: COMPTABLE_SLIDER_CONFIGS.annualMin.defaultValue,
  q14: "monthly_12",
  q15: "included",
  q16: null,
  q17: SALES_SKIP_VALUE,
  q18: SALES_SKIP_VALUE,
  q19: ["recurring", "acquisition", "seo"],
  q21: ["reactivite", "pilotage", "honoraires_lisibles"],
};

export const SALES_TEST_SESSION_CIF_QUALIFICATION: SalesQualificationValues = {
  ...SALES_TEST_SESSION_QUALIFICATION,
  o1: [],
  o2: "",
  o3: "",
  o4: [],
  o5: [],
  o6: "",
  o3FollowUp: "",
  b1: "more_dossiers",
  b2: 3,
  b3: "y2017",
  b3Year: 2017,
  b4: 6,
  b5: ["partnerships"],
  b6Acknowledged: true,
  b7: "part_inactive",
  b8: "significant_gap",
  bleedDiagnosticAccepted: true,
  q11: ["freelancers", "tpe"],
  q1: ["patrimoine_epargne", "tresorerie_entreprise", "transmission"],
  q2: ["cif_amf", "ingenierie", "tresorerie"],
  q13: CIF_SLIDER_CONFIGS.annualMin.defaultValue,
  q14: "monthly_12",
  q15: "mixte",
  q16: null,
  q17: SALES_SKIP_VALUE,
  q18: SALES_SKIP_VALUE,
  q19: ["recurring", "tresorerie", "transmission"],
  q21: ["architecture_ouverte", "acces_associe", "remuneration_lisible"],
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
  if (audience === "cif") {
    return {
      slug: SALES_TEST_SESSION_CIF_SLUG,
      inviteeUri: SALES_TEST_SESSION_CIF_INVITEE_URI,
      company: SALES_TEST_SESSION_CIF_COMPANY,
      calendlyQuestions: SALES_TEST_SESSION_CIF_CALENDLY_QUESTIONS,
      qualification: SALES_TEST_SESSION_CIF_QUALIFICATION,
      closing: SALES_TEST_SESSION_CLOSING,
      profileForm: {},
      leadCategory: "cif",
    };
  }

  if (isComptableSalesAudience(audience)) {
    // #region agent log
    fetch('http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'dd574e'},body:JSON.stringify({sessionId:'dd574e',location:'sales-test-session-preset.ts:getSalesTestSessionPreset',message:'comptable preset resolved',data:{company:SALES_TEST_SESSION_COMPTABLE_COMPANY,slug:SALES_TEST_SESSION_COMPTABLE_SLUG},timestamp:Date.now(),runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
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
  return slug === SALES_TEST_SESSION_SLUG || slug === SALES_TEST_SESSION_COMPTABLE_SLUG || slug === SALES_TEST_SESSION_CIF_SLUG;
}

export function salesTestSessionSlugForAudience(audience: Audience): string {
  return getSalesTestSessionPreset(audience).slug;
}
