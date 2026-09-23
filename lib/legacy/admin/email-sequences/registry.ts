import type { Audience, Niche } from "@/lib/legacy/admin/navigation";

import { RESEND_EMAIL_SEQUENCES } from "@/lib/(resend)/sequences/entries";
import type { EmailSequenceEntry, EmailSequencePhase } from "@/lib/(resend)/sequences/entries";

export type {
  EmailSequenceEditorKind,
  EmailSequenceEntry,
  EmailSequencePhase,
  EmailSequenceProvider,
  EmailSequenceStatus,
  EmailSequenceStep,
} from "@/lib/(resend)/sequences/entries";

const NON_RESEND_EMAIL_SEQUENCES: EmailSequenceEntry[] = [
{
    id: "outreach-stats",
    slug: "outreach-stats",
    name: "Outreach — statistiques campagnes",
    phase: "pre_close",
    category: "Outreach",
    stepCount: 0,
    status: "spec",
    provider: "instantly",
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
    description: "Prompt IA par campagne Instantly pour réponses automatiques.",
    steps: [{ id: "prompt", label: "Prompt", delay: "—" }],
    editorKind: "reply_agent",
    streamlitHint: "pnpm streamlit-reply-agent",
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
    audiences: ["agence", "comptable", "entreprise", "cif"],
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
];

const EMAIL_SEQUENCES: EmailSequenceEntry[] = [
  ...NON_RESEND_EMAIL_SEQUENCES,
  ...RESEND_EMAIL_SEQUENCES,
];

function matchesAudience(entry: EmailSequenceEntry, audience: Audience): boolean {
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
  return `/internal/${audience}/rendez-vous?tab=sequences&sequence=${slug}`;
}

export function emailsHubHref(audience: Audience): string {
  return `/internal/${audience}/rendez-vous?tab=sequences`;
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
  comptable: {
    "emails/pre_close/booking": "meeting-comptable",
  },
  cif: {
    "emails/pre_close/booking": "meeting-cif",
  },
  jum: {
    "emails/pre_close/booking": "meeting-jum",
  },
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

export function meetingSequenceSlugForNiche(niche: Niche): string {
  return `meeting-${niche}`;
}

export { BOOKING_SEQUENCE_SLUGS, bookingSequenceTypesFor } from "@/lib/(resend)/sequences/booking-slugs";
