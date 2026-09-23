import type { Audience, Niche } from "@/lib/legacy/admin/navigation";
import type { LeadCategory } from "@/lib/legacy/link-tracking/types";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import type { BypassTemplateKey } from "@/lib/legacy/instantly-bypass/types";

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
  audiences: Niche[];
  description: string;
  steps: EmailSequenceStep[];
  editorKind: EmailSequenceEditorKind;
  bookingCategory?: LeadCategory;
  bypassTemplateKeys?: BypassTemplateKey[];
  legacyDoc?: string;
  streamlitHint?: string;
};

export const RESEND_EMAIL_SEQUENCES: EmailSequenceEntry[] = [
{
    id: "meeting-agence",
    slug: "meeting-agence",
    name: "Meeting sequence — Agence",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 3,
    status: "spec",
    provider: "resend",
    audiences: ["agence"],
    description: "Désactivée — séquence confirmation Resend et annulation auto H-20 retirées.",
    steps: [
      { id: "immediate", label: "Confirmation", delay: "Immédiat", emailType: "immediate" },
      { id: "h48_confirm", label: "Confirmation requise", delay: "H-48", emailType: "h48_confirm" },
      { id: "h24_relance", label: "Relance", delay: "H-24", emailType: "h24_relance" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    streamlitHint: "pnpm streamlit-booking-resend",
  },
{
    id: "meeting-entreprise",
    slug: "meeting-entreprise",
    name: "Meeting sequence — Leads",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 3,
    status: "spec",
    provider: "resend",
    audiences: ["entreprise"],
    description: "Désactivée — séquence confirmation Resend retirée.",
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
    id: "meeting-comptable",
    slug: "meeting-comptable",
    name: "Meeting sequence — Comptable",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 3,
    status: "spec",
    provider: "resend",
    audiences: ["comptable"],
    description: "Désactivée — séquence confirmation Resend et annulation auto H-20 retirées.",
    steps: [
      { id: "immediate", label: "Confirmation", delay: "Immédiat", emailType: "immediate" },
      { id: "h48_confirm", label: "Confirmation requise", delay: "H-48", emailType: "h48_confirm" },
      { id: "h24_relance", label: "Relance", delay: "H-24", emailType: "h24_relance" },
    ],
    editorKind: "booking",
    bookingCategory: "comptable",
    streamlitHint: "pnpm streamlit-booking-resend",
  },
{
    id: "meeting-cif",
    slug: "meeting-cif",
    name: "Meeting sequence — CIF",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 3,
    status: "spec",
    provider: "resend",
    audiences: ["cif"],
    description: "Désactivée — séquence confirmation Resend et annulation auto H-20 retirées.",
    steps: [
      { id: "immediate", label: "Confirmation", delay: "Immédiat", emailType: "immediate" },
      { id: "h48_confirm", label: "Confirmation requise", delay: "H-48", emailType: "h48_confirm" },
      { id: "h24_relance", label: "Relance", delay: "H-24", emailType: "h24_relance" },
    ],
    editorKind: "booking",
    bookingCategory: "cif",
    streamlitHint: "pnpm streamlit-booking-resend",
  },
{
    id: "role-recovery",
    slug: "role-recovery",
    name: "Role recovery",
    phase: "pre_close",
    category: "Meeting",
    stepCount: 2,
    status: "spec",
    provider: "resend",
    audiences: ["agence", "comptable", "entreprise", "cif"],
    description: "Désactivée — récupération rôle agence (role_seq_48 / role_seq_24) retirée.",
    steps: [
      { id: "role_seq_48", label: "Email J-2", delay: "H-48", emailType: "role_seq_48" },
      { id: "role_seq_24", label: "Email J-1", delay: "H-24", emailType: "role_seq_24" },
    ],
    editorKind: "booking",
    bookingCategory: "agence",
    streamlitHint: "pnpm streamlit-booking-resend",
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    legacyDoc: "lib/legacy/calendly-seat-onboarding/ (agence) · lib/(resend)/calendly-seat/ (client)",
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    id: "free-trial",
    slug: "free-trial",
    name: "Free trial — pré-paiement (J+1 → J+3)",
    phase: "close",
    category: "Close",
    stepCount: 3,
    status: "built",
    provider: "resend",
    audiences: ["comptable"],
    description:
      "Nurture manuelle Clients → Séquences. E1–E3 à J+1/J+2/J+3. Stop si reply/opt-out ou checkout trial. Pitch : page /proposition, essai DEC 14j puis 1 499 €/mois.",
    steps: [
      {
        id: "free_trial_1",
        label: "Pitch essai + RDV offert",
        delay: "J+1",
        emailType: "free_trial_1",
      },
      {
        id: "free_trial_2",
        label: "Relance essai",
        delay: "J+2",
        emailType: "free_trial_2",
      },
      {
        id: "free_trial_3",
        label: "Dernière relance",
        delay: "J+3",
        emailType: "free_trial_3",
      },
    ],
    editorKind: "booking",
    bookingCategory: "comptable",
  },
{
    id: "payment-onboarding",
    slug: "payment-onboarding",
    name: "Onboarding post-paiement (DEC · CIF · IAS)",
    phase: "close",
    category: "Onboarding",
    stepCount: 9,
    status: "built",
    provider: "resend",
    audiences: ["comptable", "cif", "entreprise"],
    description:
      "Déclenchée par Stripe checkout (DEC/CIF/IAS) quand PAYMENT_ONBOARDING_SEQUENCE_ENABLED=1. E1 immédiat, E2 J0+2h, E3 J0 17h Paris, E4–E9 J+3/6/9/12/15/20. Plain text, signature Courtage en projet BNC/BIC/TNS. Ne s'arrête pas sur reply.",
    steps: [
      {
        id: "payment_onboarding_1",
        label: "Bienvenue post-paiement",
        delay: "Immédiat (stripe_payment)",
        emailType: "payment_onboarding_1",
      },
      {
        id: "payment_onboarding_2",
        label: "Calendly Pro & Zoom Pro",
        delay: "J0 +2h",
        emailType: "payment_onboarding_2",
      },
      {
        id: "payment_onboarding_3",
        label: "Date premier RDV",
        delay: "J0 17:00 Paris",
        emailType: "payment_onboarding_3",
      },
      {
        id: "payment_onboarding_4",
        label: "Protocole déploiement",
        delay: "J+3",
        emailType: "payment_onboarding_4",
      },
      {
        id: "payment_onboarding_5",
        label: "Configuration",
        delay: "J+6",
        emailType: "payment_onboarding_5",
      },
      {
        id: "payment_onboarding_6",
        label: "Qualification",
        delay: "J+9",
        emailType: "payment_onboarding_6",
      },
      {
        id: "payment_onboarding_7",
        label: "Calendly imminents",
        delay: "J+12",
        emailType: "payment_onboarding_7",
      },
      {
        id: "payment_onboarding_8",
        label: "Premier lead",
        delay: "J+15",
        emailType: "payment_onboarding_8",
      },
      {
        id: "payment_onboarding_9",
        label: "Premier RDV arrive",
        delay: "J+20",
        emailType: "payment_onboarding_9",
      },
    ],
    editorKind: "booking",
    bookingCategory: "comptable",
    legacyDoc: "lib/(resend)/onboarding/",
  },
{
    id: "free-trial-started",
    slug: "free-trial-started",
    name: "Free trial — post-paiement (essai commencé)",
    phase: "close",
    category: "Onboarding",
    stepCount: 1,
    status: "built",
    provider: "resend",
    audiences: ["comptable"],
    description:
      "Déclenchée par Stripe checkout essai (metadata product=free_trial). Email unique immédiat : essai 14 jours, portail désabonnement, tableau de bord.",
    steps: [
      {
        id: "free_trial_started_1",
        label: "Essai commencé",
        delay: "Immédiat (stripe_payment)",
        emailType: "free_trial_started_1",
      },
    ],
    editorKind: "booking",
    bookingCategory: "comptable",
  },
{
    id: "proposition-ludovic-post-payment",
    slug: "proposition-ludovic-post-payment",
    name: "Proposition Ludovic — post-paiement",
    phase: "close",
    category: "Onboarding",
    stepCount: 4,
    status: "built",
    provider: "resend",
    audiences: ["comptable"],
    description:
      "Déclenchée par Payment Link Stripe (metadata proposition_slug=ludovic). E1 immédiat avec config par défaut, E2 +24h (Calendly), E3 +48h, E4 +5j. Premier RDV estimé J+20. Volume selon offre (15 ou 45 profils).",
    steps: [
      {
        id: "proposition_ludovic_welcome",
        label: "Confirmation paiement + config par défaut",
        delay: "Immédiat (stripe_payment)",
        emailType: "proposition_ludovic_welcome",
      },
      {
        id: "proposition_ludovic_config_ready",
        label: "Configuration terminée + invitation Calendly",
        delay: "+24h",
        emailType: "proposition_ludovic_config_ready",
      },
      {
        id: "proposition_ludovic_rdv_reminder",
        label: "Rappel premier RDV",
        delay: "+48h",
        emailType: "proposition_ludovic_rdv_reminder",
      },
      {
        id: "proposition_ludovic_rdv_final",
        label: "Dernier rappel automatique",
        delay: "+5j",
        emailType: "proposition_ludovic_rdv_final",
      },
    ],
    editorKind: "booking",
    bookingCategory: "comptable",
  },
{
    id: "comptable-acquisition-post-payment",
    slug: "comptable-acquisition-post-payment",
    name: "Acquisition comptable 1 489 € — post-paiement",
    phase: "close",
    category: "Onboarding",
    stepCount: 4,
    status: "built",
    provider: "resend",
    audiences: ["comptable"],
    description:
      "Déclenchée par Payment Link Stripe (metadata product=comptable_acquisition_1489). E1 immédiat, E2 +24h, E3 +48h, E4 +5j. Numéro suivi DHL HRC-{slug}, premier RDV estimé J+25.",
    steps: [
      {
        id: "comptable_acquisition_welcome",
        label: "Bienvenue + récap paiement",
        delay: "Immédiat (stripe_payment)",
        emailType: "comptable_acquisition_welcome",
      },
      {
        id: "comptable_acquisition_config_ready",
        label: "Configuration terminée",
        delay: "+24h",
        emailType: "comptable_acquisition_config_ready",
      },
      {
        id: "comptable_acquisition_rdv_reminder",
        label: "Rappel premier RDV",
        delay: "+48h",
        emailType: "comptable_acquisition_rdv_reminder",
      },
      {
        id: "comptable_acquisition_rdv_final",
        label: "Dernier rappel auto",
        delay: "+5j",
        emailType: "comptable_acquisition_rdv_final",
      },
    ],
    editorKind: "booking",
    bookingCategory: "comptable",
  },
{
    id: "onboarding-sequence",
    slug: "onboarding-sequence",
    name: "Séquence onboarding post-formulaire",
    phase: "close",
    category: "Onboarding",
    stepCount: 7,
    status: "built",
    provider: "resend",
    audiences: ["agence", "comptable", "cif"],
    description:
      "Déclenché après complétion du formulaire onboarding (completeOnboarding=true). Si rétractation conservée : hold immédiat. Sinon (waiver) : J0 ×2, J+1, rappels J-10 → J+5 relatifs à estimated_first_booking_at.",
    steps: [
      {
        id: "email0",
        label: "Hold rétractation",
        delay: "Immédiat si rétractation conservée",
        emailType: "onboarding_retraction_hold",
      },
      { id: "email1", label: "Bienvenue activation", delay: "Immédiat (post-waiver)", emailType: "onboarding_j0" },
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
    description:
      "Survey fin de RDV avec token — entreprise et agence, chacun avec une relance +24h si pas de réponse.",
    steps: [
      { id: "post_rdv_survey_entreprise", label: "Survey Leads", delay: "Fin RDV", emailType: "survey_rdv_entreprise" },
      { id: "post_rdv_survey_entreprise_followup", label: "Relance Leads", delay: "+24h si pas de réponse", emailType: "survey_rdv_entreprise_followup" },
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
    audiences: ["agence", "entreprise"],
    description: "Notification statut commercial paiement.",
    steps: [{ id: "payment_notification", label: "Paiement", delay: "Event", emailType: "payment_notification_client" }],
    editorKind: "booking",
    legacyDoc: "archive/2026-09-pre-architecture/documentations_2/sequence_email.md",
  },
];
