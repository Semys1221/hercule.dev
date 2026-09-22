export type ClientAppointmentStatus =
  | "scheduled"
  | "no_show"
  | "refused"
  | "rescheduled"
  | "canceled";

export type ClientAppointmentRow = {
  id: string;
  client_id: string;
  calendly_invitee_uri: string;
  calendly_event_uri: string | null;
  calendly_event_type_uri: string | null;
  invitee_email: string;
  invitee_name: string | null;
  questions: Record<string, string>;
  scheduled_at: string | null;
  status: ClientAppointmentStatus;
  credited: boolean;
  join_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ClientAppointmentPublic = {
  id: string;
  inviteeName: string | null;
  inviteeEmail: string;
  scheduledAt: string | null;
  status: ClientAppointmentStatus;
  questions: Record<string, string>;
  joinUrl: string | null;
  canAct: boolean;
};
