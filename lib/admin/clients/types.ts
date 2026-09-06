import type { DashboardFormData, DashboardMode, TimelineStep } from "@/lib/dashboard/types";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { MatchRow } from "@/lib/matching/store";

export const PRODUCT_STATUT_VALUES = [
  "NONE",
  "PAID_PENDING_ONBOARDING",
  "ONBOARDED",
  "IN_DELIVERANCE",
  "MATCH_PROPOSED",
  "MEETING_BOOKED",
  "POST_RDV_SURVEY",
  "SOLD",
  "ARCHIVED",
  "CANCELLED",
] as const;

export type ProductStatut = (typeof PRODUCT_STATUT_VALUES)[number];

export const PRODUCT_STATUT_LABELS: Record<string, string> = {
  NONE: "—",
  PAID_PENDING_ONBOARDING: "En attente onboarding",
  ONBOARDED: "Onboardé",
  IN_DELIVERANCE: "En livraison",
  MATCH_PROPOSED: "Match proposé",
  MEETING_BOOKED: "RDV réservé",
  POST_RDV_SURVEY: "Post-RDV",
  SOLD: "Vendu",
  ARCHIVED: "Archivé",
  CANCELLED: "Annulé",
};

export function isProductStatut(value: string): value is ProductStatut {
  return (PRODUCT_STATUT_VALUES as readonly string[]).includes(value);
}

export const DEFAULT_TIMELINE: TimelineStep[] = [
  { id: "confirmed", label: "Commande confirmée", status: "done" },
  { id: "setup", label: "Mise en place", status: "pending" },
  { id: "preparation", label: "Première livraison en préparation", status: "pending" },
  { id: "delivery", label: "Première demande attribuée", status: "pending" },
];

export type ClientCockpitData = {
  category: LeadCategory;
  id: string;
  slug: string;
  email: string;
  firstName: string | null;
  company: string | null;
  statut: string;
  productStatut: string;
  scheduledAt: string | null;
  dashboardLink: string | null;
  onboardingCompletedAt: string | null;
  isPaid: boolean;
  dashboardMode: DashboardMode | null;
  form: DashboardFormData;
  timeline: TimelineStep[];
  matches: MatchRow[];
};
