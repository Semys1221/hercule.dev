import type { DashboardRetraction } from "@/lib/retraction";

export type DashboardMode =
  | "onboarding_preview"
  | "dashboard_state"
  | "dashboard_active"
  | "comptable_active"
  | "comptable_pending"
  | "comptable_onboarding"
  | "entreprise_preview";

export type DashboardFaqAudience = "agence" | "comptable" | "entreprise";

export type TimelineStep = {
  id: string;
  label: string;
  status: "done" | "active" | "pending";
  meta?: string;
};

export type DashboardFaqItem = {
  q: string;
  a: string;
};

export type DashboardFormData = {
  specialites?: string[];
  zone?: string;
  capacite?: number;
  budgetMinPonctuel?: number;
  budgetMinMensuel?: number;
};

export type DashboardEnterpriseBrief = {
  matchId: string;
  status: "proposed" | "booked" | "completed" | "cancelled";
  secteur?: string;
  prestation?: string;
  budget?: string;
  companyLabel?: string;
  verso?: {
    dureeSouhaitee: string;
    horizonResultat: string;
    historiqueAgences: string;
  };
};

export type DashboardDeliveryPlan = {
  formulaLabel: string;
  attributionsTotal: number;
  attributionsUsed: number;
};

export type DashboardPaymentSchedule = {
  offerType: string;
  depositPaid: boolean;
  balanceDue: boolean;
  balancePaid: boolean;
  balanceAmountCents: number;
  deliveryComplete: boolean;
};

export type DashboardData = {
  slug: string;
  email: string;
  firstName: string | null;
  company: string | null;
  statut: string;
  productStatut: string;
  scheduledAt: string | null;
  dashboardLink: string | null;
  timeline: TimelineStep[];
  onboardingCompleted: boolean;
  tieDownAccepted: boolean;
  form: DashboardFormData;
  faq: DashboardFaqItem[];
  isPaid: boolean;
  dashboardMode: DashboardMode;
  audience: DashboardFaqAudience;
  deliveryPlan: DashboardDeliveryPlan | null;
  enterpriseBrief: DashboardEnterpriseBrief | null;
  comptable?: {
    offerType: string;
    succeededAt: string;
  } | null;
  offerType?: string | null;
  paymentSchedule?: DashboardPaymentSchedule | null;
  retraction?: DashboardRetraction | null;
  milestones?: TimelineStep[];
};
