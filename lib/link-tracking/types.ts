export type LeadCategory = "agence" | "entreprise";

export type LeadStatut =
  | "NOTBOOKED"
  | "CLICKED"
  | "BOOKED"
  | "MEETING_BOOKED"
  | "CONFIRMED"
  | "CANCELLED";

export type LinkTrackingLead = {
  id: string;
  email: string;
  statut: LeadStatut;
  slug: string;
  reservation_agence_link: string;
  reservation_entreprise_link: string;
  confirmation_agence_link: string;
  instantly_lead_id: string | null;
  instantly_campaign_id: string | null;
  calendly_invitee_uri: string | null;
  calendly_join_url: string | null;
  calendly_reschedule_url: string | null;
  calendly_cancel_url: string | null;
  calendly_links_synced_at: string | null;
  calendly_links_sync_error: string | null;
  booked_at: string | null;
  instantly_synced_at: string | null;
  first_name: string | null;
  company: string | null;
  calendly_payload: Record<string, unknown> | null;
  calendly_questions: Record<string, string> | null;
  scheduled_at: string | null;
  confirmed_at: string | null;
  instantly_confirmed_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadLookup = {
  category: LeadCategory;
  lead: LinkTrackingLead;
};

export function isMeetingBookedStatus(statut: LeadStatut | string): boolean {
  return statut === "MEETING_BOOKED" || statut === "BOOKED";
}
