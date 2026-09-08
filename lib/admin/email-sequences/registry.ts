import type { Audience } from "@/lib/admin/navigation";
import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

export type EmailSequencePhase = "pre_close" | "close";

export type EmailSequenceStatus = "built" | "spec";

export type EmailSequenceProvider = "resend" | "instantly" | "hybrid";

export type EmailSequenceEditorKind =
  | "booking"
  | "bypass"
  | "reply_agent"
  | "outreach_stats"
  | "placeholder";

export type EmailSequenceStep = {
  id: string;
  label: string;
  delay: string;
  emailType?: BookingEmailType;
  templateKey?: BypassTemplateKey;
};

export type EmailSequenceEntry = {
  id: string;
  slug: string;
  name: string;
  phase: EmailSequencePhase;
  category: string;
  stepCount: number;
  status: EmailSequenceStatus;
  provider: EmailSequenceProvider;
  audiences: Audience[] | "both";
  description: string;
  steps: EmailSequenceStep[];
  editorKind: EmailSequenceEditorKind;
  /** Booking category when editorKind is booking */
  bookingCategory?: "agence" | "entreprise";
  /** Template keys filter for bypass editor */
  bypassTemplateKeys?: BypassTemplateKey[];
  legacyDoc?: string;
  streamlitHint?: string;
};

const EMAIL_SEQUENCES: EmailSequenceEntry[] = [
  {
    id: "outreach-stats",
    slug: "outreach-stats",
    name: "Outreach — statistiques campagnes",
    phase: "pre_close",
    category: "Outreach",
    stepCount: 0,
    status: "spec",
    provider: "instantly",
    audiences: "both",
    description:
      "Enregistrement et analyse des stats campagnes Instantly (pas d'édition copy outreach).",
    steps: [],
    editorKind: "outreach_stats",
    streamlitHint: "pnpm streamlit-stats",
    legacyDoc: "archive/2026-09-pre-architecture/documentations_2/sequence_email.md",
  },
  {
    id: "subsequence-interested",
    slug: "subsequence-interested",
    name: "Subsequence Interested (E1→E3)",
    phase: "pre_close",
    category: "Subsequence",
    stepCount: 3,
    status: "built",
    provider: "instantly",
    audiences: "both",
    description: "Séquence interested post-webhook — E1 immédiat, E2 +24h, E3 +48h.",
    steps: [
      { id: "interested_email1", label: "Email 1", delay: "Immédiat", templateKey: "interested_email1" },
      { id: "interested_email2", label: "Email 2", delay: "+24h", templateKey: "interested_email2" },
      { id: "interested_email3", label: "Email 3", delay: "+48h", templateKey: "interested_email3" },
    ],
    editorKind: "bypass",
    bypassTemplateKeys: ["interested_email1", "interested_email2", "interested_email3"],
    streamlitHint: "pnpm streamlit-subsequence",
  },
  {
    id: "reply-agent",
    slug: "reply-agent",
    name: "Reply Agent",
    phase: "pre_close",
    category: "Reply Agent",
    stepCount: 1,
    status: "built",
    provider: "hybrid",
    audiences: "both",
    description: "Prompt IA par campagne Instantly pour réponses automatiques.",
    steps: [{ id: "prompt", label: "Prompt", delay: "—" }],
    editorKind: "reply_agent",
    streamlitHint: "pnpm streamlit-reply-agent",
  },
  {
    id: "meeting-agence",
    slug: "meeting-agence",
    name: "Meeting sequence — Agence",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 4,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description: "Séquence booking Calendly agence : immediate, h48, h24, h20.",
    steps: [
      { id: "immediate", label: "Confirmation", delay: "Immédiat", emailType: "immediate" },
      { id: "h48_confirm", label: "Confirmation requise", delay: "H-48", emailType: "h48_confirm" },
      { id: "h24_relance", label: "Relance", delay: "H-24", emailType: "h24_relance" },
      { id: "h20_cancel", label: "Annulation", delay: "H-20", emailType: "h20_cancel" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    streamlitHint: "pnpm streamlit-booking-resend",
  },
  {
    id: "meeting-entreprise",
    slug: "meeting-entreprise",
    name: "Meeting sequence — Entreprise",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 3,
    status: "built",
    provider: "resend",
    audiences: ["entreprise"],
    description: "Séquence booking Calendly entreprise : immediate, h48, h24.",
    steps: [
      { id: "immediate", label: "Confirmation", delay: "Immédiat", emailType: "immediate" },
      { id: "h48_confirm", label: "Préparation RDV", delay: "H-48", emailType: "h48_confirm" },
      { id: "h24_relance", label: "Rappel", delay: "H-24", emailType: "h24_relance" },
    ],
    editorKind: "booking",
    bookingCategory: "entreprise",
    streamlitHint: "pnpm streamlit-booking-resend",
  },
  {
    id: "role-recovery",
    slug: "role-recovery",
    name: "Role recovery",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 2,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description: "Récupération rôle agence : role_seq_48 et role_seq_24.",
    steps: [
      { id: "role_seq_48", label: "Email J-2", delay: "H-48", emailType: "role_seq_48" },
      { id: "role_seq_24", label: "Email J-1", delay: "H-24", emailType: "role_seq_24" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    streamlitHint: "pnpm streamlit-booking-resend",
  },
  {
    id: "no-show",
    slug: "no-show",
    name: "No-show",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 3,
    status: "built",
    provider: "instantly",
    audiences: "both",
    description: "Séquence absence : immédiat, +24h, +48h (dernier sans lien reschedule).",
    steps: [
      { id: "no_show_email1", label: "Email 1", delay: "Immédiat", templateKey: "no_show_email1" },
      { id: "no_show_email2", label: "Email 2", delay: "+24h", templateKey: "no_show_email2" },
      { id: "interested_email3", label: "Email 3", delay: "+48h", templateKey: "interested_email3" },
    ],
    editorKind: "bypass",
    bypassTemplateKeys: ["no_show_email1", "no_show_email2", "interested_email3"],
    streamlitHint: "pnpm streamlit-subsequence",
  },
  {
    id: "upsell",
    slug: "upsell",
    name: "Upsell (1 489 € / 989 € × 3)",
    phase: "pre_close",
    category: "Pre-close",
    stepCount: 3,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Déclenchée automatiquement quand le sales call passe au statut `completed` (appel concluant, intention confirmée, pré-paiement). Propose le plein tarif (1 489 € / mois) vs pack 3 mois (989 € × 3 = 2 967 €, 15 Attributions).",
    steps: [
      { id: "email1", label: "Email 1", delay: "Immédiat", emailType: "upsell_email_1" },
      { id: "email2", label: "Email 2", delay: "+7j", emailType: "upsell_email_2" },
      { id: "email3", label: "Email 3", delay: "+14j", emailType: "upsell_email_3" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    legacyDoc: "archive/2026-09-pre-architecture/documentations_2/sequence_client_not_paid.md",
  },
  {
    id: "calendly-seat-onboarding",
    slug: "calendly-seat-onboarding",
    name: "Calendly seat — activation post-onboarding",
    phase: "close",
    category: "Onboarding",
    stepCount: 2,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Déclenché après complétion du formulaire onboarding (PATCH completeOnboarding=true) : email invitation Calendly, puis relance +24h si invitation non acceptée. Le siège Calendly est ajouté manuellement par ops après réception de la notification.",
    steps: [
      {
        id: "product_calendly_welcome",
        label: "Invitation Calendly",
        delay: "Immédiat (post-onboarding)",
        emailType: "product_calendly_welcome",
      },
      {
        id: "product_calendly_reminder",
        label: "Relance acceptation",
        delay: "+24h si non accepté",
        emailType: "product_calendly_reminder",
      },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
  },
  {
    id: "close-indecis",
    slug: "close-indecis",
    name: "Close — Indécis non payé",
    phase: "close",
    category: "Closing",
    stepCount: 3,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Séquence déclenchée via le bouton Non Payé dans Bookings (ou le statut not_paid). Envoie le lien dashboard pour finaliser le paiement.",
    steps: [
      { id: "email1", label: "Email 1", delay: "Immédiat", emailType: "close_indecis_1" },
      { id: "email2", label: "Email 2", delay: "+24h", emailType: "close_indecis_2" },
      { id: "email3", label: "Email 3", delay: "+48h", emailType: "close_indecis_3" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    legacyDoc: "archive/2026-09-pre-architecture/documentations_2/sequence_client_not_paid.md",
  },
  {
    id: "sales-call-no-show",
    slug: "sales-call-no-show",
    name: "Close — Absence no-show",
    phase: "close",
    category: "Closing",
    stepCount: 3,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Séquence déclenchée via le bouton No Show dans Bookings (ou le statut no_show). Email 1 : objet « Absence — » ; emails 2 et 3 en réponse dans le même fil. CTA = lien de réservation tracké.",
    steps: [
      { id: "email1", label: "Email 1", delay: "Immédiat", emailType: "no_show_indecis_1" },
      { id: "email2", label: "Email 2", delay: "+24h", emailType: "no_show_indecis_2" },
      { id: "email3", label: "Email 3", delay: "+48h", emailType: "no_show_indecis_3" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
  },
  {
    id: "payment-welcome",
    slug: "payment-welcome",
    name: "Notification post-paiement (product_payment_welcome)",
    phase: "close",
    category: "Onboarding",
    stepCount: 1,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Email unique envoyé immédiatement après paiement Stripe (webhook checkout.session.completed). Bienvenue, invite à compléter l'onboarding, mentionne la facture (émise, reçue d'ici peu). Aucune information meeting/livraison.",
    steps: [
      {
        id: "product_payment_welcome",
        label: "Bienvenue post-paiement",
        delay: "Immédiat (stripe_payment)",
        emailType: "product_payment_welcome",
      },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
  },
  {
    id: "onboarding-sequence",
    slug: "onboarding-sequence",
    name: "Séquence onboarding post-formulaire",
    phase: "close",
    category: "Onboarding",
    stepCount: 6,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Déclenché après complétion du formulaire onboarding (completeOnboarding=true). J0 ×2, J+1, rappels J-10 → J+5 relatifs à estimated_first_booking_at. Les emails J0/J+1 seront envoyés automatiquement ; J-10/J-5/J+5 attendent un cron avec la date de référence.",
    steps: [
      { id: "email1", label: "Bienvenue activation", delay: "Immédiat", emailType: "onboarding_j0" },
      { id: "email2", label: "Email J0 bis", delay: "17:00 même jour", emailType: "onboarding_j0_bis" },
      { id: "email3", label: "Suivi J+1", delay: "08:00 jour suivant", emailType: "onboarding_j1" },
      { id: "email4", label: "Rappel J-10", delay: "estimated_first_booking_at − 10j", emailType: "onboarding_reminder_m10" },
      { id: "email5", label: "Rappel J-5", delay: "estimated_first_booking_at − 5j", emailType: "onboarding_reminder_m5" },
      { id: "email6", label: "Rappel J+5", delay: "estimated_first_booking_at + 5j", emailType: "onboarding_reminder_p5" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    legacyDoc: "archive/2026-09-pre-architecture/documentations_2/sequence_email.md",
  },
  {
    id: "deliverance",
    slug: "deliverance",
    name: "Délivrance",
    phase: "close",
    category: "Délivrance",
    stepCount: 4,
    status: "built",
    provider: "resend",
    audiences: "both",
    description: "Recherche lancée, mise à jour J+7, milestones, waitlist.",
    steps: [
      { id: "deliverance_search_started", label: "Recherche lancée", delay: "startedAt + offset", emailType: "deliverance_search_started" },
      { id: "deliverance_d7_update", label: "Mise à jour J+7", delay: "+7j (+ offset)", emailType: "deliverance_d7_update" },
      { id: "deliverance_step_milestone", label: "Milestone step", delay: "ADVANCE_STEP", emailType: "deliverance_milestone" },
      { id: "deliverance_waitlist_notice", label: "File d'attente", delay: "Queue enter", emailType: "deliverance_waitlist" },
    ],
    editorKind: "booking",
    legacyDoc: "archive/2026-09-pre-architecture/tech-stack-legacy/deliverance/communication.md",
  },
  {
    id: "matching-proposal",
    slug: "matching-proposal",
    name: "Proposition agence (match_proposal_entreprise)",
    phase: "close",
    category: "Matching",
    stepCount: 2,
    status: "built",
    provider: "resend",
    audiences: ["entreprise"],
    description:
      "Admin match agence → entreprise : email immédiat avec infos agence + lien Calendly de l'agence. Relance +24h si l'entreprise n'a pas réservé.",
    steps: [
      { id: "match_proposal_entreprise", label: "Proposition agence", delay: "Admin trigger", emailType: "match_proposal" },
      { id: "match_proposal_entreprise_followup", label: "Relance si pas de booking", delay: "+24h", emailType: "match_proposal_followup" },
    ],
    editorKind: "booking",
    bookingCategory: "entreprise",
    legacyDoc: "archive/2026-09-pre-architecture/tech-stack-legacy/matching/communication.md",
  },
  {
    id: "matching-booking",
    slug: "matching-booking",
    name: "Confirmation RDV (match_booking_confirm_agence)",
    phase: "close",
    category: "Matching",
    stepCount: 1,
    status: "built",
    provider: "resend",
    audiences: ["agence"],
    description:
      "Email envoyé à l'agence quand l'entreprise réserve via le lien Calendly de l'agence. Contient les informations de l'entreprise matchée.",
    steps: [
      { id: "match_booking_confirm_agence", label: "Confirmation RDV (Agence)", delay: "Webhook Calendly book", emailType: "match_booking_agence" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    legacyDoc: "archive/2026-09-pre-architecture/tech-stack-legacy/matching/communication.md",
  },
  {
    id: "post-rdv-survey",
    slug: "post-rdv-survey",
    name: "Survey post-RDV (post_rdv_survey_*)",
    phase: "close",
    category: "Post-RDV",
    stepCount: 4,
    status: "built",
    provider: "resend",
    audiences: "both",
    description:
      "Survey fin de RDV avec token — entreprise et agence, chacun avec une relance +24h si pas de réponse.",
    steps: [
      { id: "post_rdv_survey_entreprise", label: "Survey Entreprise", delay: "Fin RDV", emailType: "survey_rdv_entreprise" },
      { id: "post_rdv_survey_entreprise_followup", label: "Relance Entreprise", delay: "+24h si pas de réponse", emailType: "survey_rdv_entreprise_followup" },
      { id: "post_rdv_survey_agence", label: "Survey Agence", delay: "Fin RDV", emailType: "survey_rdv_agence" },
      { id: "post_rdv_survey_agence_followup", label: "Relance Agence", delay: "+24h si pas de réponse", emailType: "survey_rdv_agence_followup" },
    ],
    editorKind: "booking",
    legacyDoc: "archive/2026-09-pre-architecture/tech-stack-legacy/post-rdv/communication.md",
  },
  {
    id: "entreprise-sold-check",
    slug: "entreprise-sold-check",
    name: "Check onboarding J+7 (entreprise_onboarding_check_j7)",
    phase: "close",
    category: "Post-RDV",
    stepCount: 1,
    status: "built",
    provider: "resend",
    audiences: ["entreprise"],
    description: "« Votre onboarding s'est bien passé ? » — seul email post-SOLD entreprise.",
    steps: [{ id: "entreprise_onboarding_check_j7", label: "Check J+7", delay: "SOLD +7j", emailType: "sold_check_j7" }],
    editorKind: "booking",
    bookingCategory: "entreprise",
    legacyDoc: "archive/2026-09-pre-architecture/tech-stack-legacy/post-rdv/communication.md",
  },
  {
    id: "notification-payment",
    slug: "notification-payment",
    name: "Notification — paiement",
    phase: "close",
    category: "Notifications",
    stepCount: 1,
    status: "built",
    provider: "resend",
    audiences: "both",
    description: "Notification statut commercial paiement.",
    steps: [{ id: "payment_notification", label: "Paiement", delay: "Event", emailType: "payment_notification_client" }],
    editorKind: "booking",
    legacyDoc: "archive/2026-09-pre-architecture/documentations_2/sequence_email.md",
  },
];

function matchesAudience(entry: EmailSequenceEntry, audience: Audience): boolean {
  if (entry.audiences === "both") {
    return true;
  }
  return entry.audiences.includes(audience);
}

export function getEmailSequences(audience: Audience): EmailSequenceEntry[] {
  return EMAIL_SEQUENCES.filter((entry) => matchesAudience(entry, audience));
}

export function getEmailSequence(slug: string): EmailSequenceEntry | null {
  return EMAIL_SEQUENCES.find((entry) => entry.slug === slug) ?? null;
}

export function isEmailSequenceSlug(slug: string): boolean {
  return EMAIL_SEQUENCES.some((entry) => entry.slug === slug);
}

export function emailSequenceHref(audience: Audience, slug: string): string {
  return `/internal/funnels/emails/${audience}/${slug}`;
}

export function emailsHubHref(audience: Audience): string {
  return `/internal/funnels/${audience}/emails`;
}

/** Legacy nav paths → new slugs (audience-specific overrides first) */
export const LEGACY_EMAIL_PATH_REDIRECTS: Record<string, string> = {
  "emails/pre_close/outreach": "outreach-stats",
  "emails/pre_close/subsequence": "subsequence-interested",
  "emails/pre_close/reply_prompt": "reply-agent",
  "emails/pre_close/booking": "meeting-agence",
  "emails/close/onboarding": "onboarding-sequence",
  "emails/close/notifications": "notification-payment",
};

const LEGACY_EMAIL_PATH_REDIRECTS_BY_AUDIENCE: Record<
  Audience,
  Record<string, string>
> = {
  agence: {
    "emails/pre_close/booking": "meeting-agence",
  },
  entreprise: {
    "emails/pre_close/booking": "meeting-entreprise",
  },
  comptable: {},
};

export function resolveLegacyEmailSlugForAudience(
  audience: Audience,
  rawPath: string[],
): string | null {
  if (rawPath[0] !== "emails" || rawPath.length < 2) {
    return null;
  }
  const legacyKey = `emails/${rawPath.slice(1).join("/")}`;
  return (
    LEGACY_EMAIL_PATH_REDIRECTS_BY_AUDIENCE[audience][legacyKey] ??
    LEGACY_EMAIL_PATH_REDIRECTS[legacyKey] ??
    null
  );
}

export const PHASE_LABELS: Record<EmailSequencePhase, string> = {
  pre_close: "PRE-CLOSE",
  close: "CLOSE",
};

export const BOOKING_SEQUENCE_SLUGS: Record<string, BookingEmailType[]> = {
  "meeting-agence": ["immediate", "h48_confirm", "h24_relance", "h20_cancel"],
  "meeting-entreprise": ["immediate", "h48_confirm", "h24_relance"],
  "role-recovery": ["role_seq_48", "role_seq_24"],
  "calendly-seat-onboarding": [
    "product_calendly_welcome",
    "product_calendly_reminder",
  ],
  "payment-welcome": ["product_payment_welcome"],
  upsell: ["upsell_email_1", "upsell_email_2", "upsell_email_3"],
  "close-indecis": ["close_indecis_1", "close_indecis_2", "close_indecis_3"],
  "sales-call-no-show": [
    "no_show_indecis_1",
    "no_show_indecis_2",
    "no_show_indecis_3",
  ],
  "onboarding-sequence": [
    "onboarding_j0",
    "onboarding_j0_bis",
    "onboarding_j1",
    "onboarding_reminder_m10",
    "onboarding_reminder_m5",
    "onboarding_reminder_p5",
  ],
  "matching-proposal": ["match_proposal", "match_proposal_followup"],
  "matching-booking": ["match_booking_agence"],
  "entreprise-sold-check": ["sold_check_j7"],
  "notification-payment:agence": ["payment_notification_client"],
  "notification-payment:entreprise": ["payment_notification_client"],
  "post-rdv-survey:agence": ["survey_rdv_agence", "survey_rdv_agence_followup"],
  "post-rdv-survey:entreprise": [
    "survey_rdv_entreprise",
    "survey_rdv_entreprise_followup",
  ],
  "deliverance:agence": [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
  "deliverance:entreprise": [
    "deliverance_search_started",
    "deliverance_d7_update",
    "deliverance_milestone",
    "deliverance_waitlist",
  ],
};

export function bookingSequenceTypesFor(
  slug: string,
  audience: Audience,
): BookingEmailType[] {
  return (
    BOOKING_SEQUENCE_SLUGS[`${slug}:${audience}`] ??
    BOOKING_SEQUENCE_SLUGS[slug] ??
    []
  );
}
