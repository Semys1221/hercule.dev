export type SalesCallStatus =
  | "scheduled"
  | "completed"
  | "no_show"
  | "not_paid"
  | "paid";

export type SalesCall = {
  id: string;
  agence_id: string | null;
  entreprise_id: string | null;
  comptable_id: string | null;
  email: string;
  calendly_invitee_uri: string;
  scheduled_at: string | null;
  status: SalesCallStatus;
  notes: Record<string, unknown>;
  forecast_cents: number | null;
  created_at: string;
};

export type SalesCallNotesPatch = {
  qualification?: Record<string, unknown>;
  closing?: Record<string, unknown>;
};
