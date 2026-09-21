import type {
  ConferenceBilling,
  ConferenceClientType,
  ConferenceOfferType,
} from "@/lib/commercial/conference-pricing";
import type { DashboardRetraction } from "@/lib/legacy/retraction";
import type { TimelineStep } from "@/lib/legacy/dashboard/types";

export type ClientMode =
  | "unavailable"
  | "client_pending"
  | "client_onboarding"
  | "client_active";

export type ClientRow = {
  id: string;
  email: string;
  slug: string;
  first_name: string | null;
  client_type: ConferenceClientType;
  secondary_vertical: "ias" | null;
  billing: ConferenceBilling;
  offer_type: ConferenceOfferType;
  rdv_total: number;
  rdv_used: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  product_statut: string;
  onboarding_completed_at: string | null;
  retraction_status: string | null;
  retraction_ends_at: string | null;
  retraction_waived_at: string | null;
  profile: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ClientCalendlySeat = {
  status: string;
  invitationStatus: string | null;
};

export type ClientFaqItem = {
  q: string;
  a: string;
};

export type ClientDashboardData = {
  slug: string;
  email: string;
  firstName: string | null;
  clientType: ConferenceClientType;
  secondaryVertical: "ias" | null;
  clientMode: ClientMode;
  isPaid: boolean;
  offerType: ConferenceOfferType;
  billing: ConferenceBilling;
  rdvTotal: number;
  rdvUsed: number;
  succeededAt: string | null;
  onboardingCompleted: boolean;
  timeline: TimelineStep[];
  retraction: DashboardRetraction | null;
  calendlySeat: ClientCalendlySeat | null;
  billingPortal: { available: boolean };
  faq: ClientFaqItem[];
  upsellUrl: string;
  contactEmail: string;
  dashboardTitle: string;
  dashboardDescription: string;
};
