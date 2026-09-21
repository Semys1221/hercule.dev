import {
  getEmailSequence,
  getEmailSequences,
  type EmailSequenceEntry,
  type EmailSequenceProvider,
} from "@/lib/legacy/admin/email-sequences/registry";
import type { Niche } from "@/lib/legacy/admin/navigation";

import type { ManagementPhase } from "./types";

const OUTREACH_SLUGS = new Set([
  "subsequence-interested",
  "reply-agent",
  "no-show",
]);

const BOOKING_SLUGS = new Set([
  "meeting-agence",
  "meeting-entreprise",
  "meeting-comptable",
  "meeting-cif",
  "role-recovery",
  "cif-conference-invite",
]);

const MEETING_SLUG_PREFIX = "meeting-";

export function phaseForSequenceSlug(slug: string): ManagementPhase | null {
  if (OUTREACH_SLUGS.has(slug)) {
    return "outreach";
  }
  if (BOOKING_SLUGS.has(slug) || slug.startsWith(MEETING_SLUG_PREFIX)) {
    return "booking";
  }
  const entry = getEmailSequence(slug);
  if (!entry) {
    return null;
  }
  if (entry.phase === "close") {
    return "client";
  }
  if (entry.provider === "resend" && entry.editorKind === "booking") {
    return "client";
  }
  return "client";
}

export function providerForSlug(slug: string): EmailSequenceProvider | null {
  if (slug === "cif-conference-invite") {
    return "resend";
  }
  return getEmailSequence(slug)?.provider ?? null;
}

export function sequencesForPhase(niche: Niche, phase: ManagementPhase): EmailSequenceEntry[] {
  const entries = getEmailSequences(niche).filter((entry) => entry.status === "built");

  const mapped = entries.filter((entry) => phaseForSequenceSlug(entry.slug) === phase);

  if (phase === "booking" && niche === "cif") {
    mapped.push({
      id: "cif-conference-invite",
      slug: "cif-conference-invite",
      name: "Conference invite CIF",
      phase: "pre_close",
      category: "Meeting",
      stepCount: 4,
      status: "built",
      provider: "resend",
      audiences: ["cif"],
      description: "Invitation conférence CIF (conference_invite + relances).",
      steps: [],
      editorKind: "booking",
      bookingCategory: "cif",
    });
  }

  return mapped;
}

export function isMeetingSequenceSlug(slug: string): boolean {
  return slug.startsWith(MEETING_SLUG_PREFIX) || slug === "role-recovery";
}

export function nextPhaseForSlug(slug: string): ManagementPhase | null {
  const phase = phaseForSequenceSlug(slug);
  const order: ManagementPhase[] = ["outreach", "booking", "client"];
  const index = phase ? order.indexOf(phase) : -1;
  if (index < 0 || index >= order.length - 1) {
    return null;
  }
  return order[index + 1];
}
