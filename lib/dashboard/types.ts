export type DashboardMode = "onboarding_preview" | "dashboard_state" | "dashboard_active";

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
  deliveryPlan: DashboardDeliveryPlan | null;
  enterpriseBrief: DashboardEnterpriseBrief | null;
};
