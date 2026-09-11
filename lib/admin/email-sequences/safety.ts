import type { Audience } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";
import {
  bookingSequenceTypesFor,
  type EmailSequenceEntry,
} from "@/lib/admin/email-sequences/registry";
import {
  defaultBookingEmailTemplate,
} from "@/lib/booking-communication/templates";
import {
  isSequenceFollowUp,
  isSequenceRoot,
  threadFamilyFor,
} from "@/lib/booking-communication/sequence-pattern";
import type { BookingEmailType } from "@/lib/booking-communication/types";

export type SequenceSafety = "on" | "off" | null;

function emailTypesForEntry(
  entry: EmailSequenceEntry,
  audience: Audience,
): BookingEmailType[] {
  const fromRegistry = bookingSequenceTypesFor(entry.slug, audience);
  if (fromRegistry.length > 0) {
    return fromRegistry;
  }
  return entry.steps
    .map((step) => step.emailType)
    .filter((type): type is BookingEmailType => Boolean(type));
}

function familyMatchesSequenceTypes(
  family: BookingEmailType[],
  sequenceTypes: BookingEmailType[],
): boolean {
  if (sequenceTypes.length === 0) {
    return false;
  }
  if (sequenceTypes.length > family.length) {
    return false;
  }
  return sequenceTypes.every((type, index) => family[index] === type);
}

function sequenceTypesFormValidFamilies(
  sequenceTypes: BookingEmailType[],
): boolean {
  if (sequenceTypes.length === 0) {
    return false;
  }

  const roots = sequenceTypes.filter((type) => isSequenceRoot(type));
  if (roots.length === 0) {
    return false;
  }

  let offset = 0;
  for (const root of roots) {
    const family = threadFamilyFor(root);
    if (!family) {
      return false;
    }
    const slice = sequenceTypes.slice(offset, offset + family.length);
    if (!familyMatchesSequenceTypes(family, slice)) {
      return false;
    }
    offset += slice.length;
  }

  return offset === sequenceTypes.length;
}

function typeCompliesWithPattern(
  emailType: BookingEmailType,
  category: LeadCategory,
): boolean {
  const family = threadFamilyFor(emailType);
  if (!family) {
    return false;
  }

  const template = defaultBookingEmailTemplate(category, emailType);
  const isRoot = isSequenceRoot(emailType);
  const isFollowUp = isSequenceFollowUp(emailType);

  if (isRoot) {
    return template.subject.trim().length > 0;
  }

  if (isFollowUp) {
    return template.subject.trim().length === 0;
  }

  return false;
}

export function evaluateSequenceSafety(
  entry: EmailSequenceEntry,
  audience: Audience,
): SequenceSafety {
  if (entry.provider !== "resend") {
    return null;
  }

  const sequenceTypes = emailTypesForEntry(entry, audience);
  if (sequenceTypes.length === 0) {
    return "off";
  }

  if (!sequenceTypesFormValidFamilies(sequenceTypes)) {
    return "off";
  }

  const category: LeadCategory =
    entry.bookingCategory ??
    (audience === "entreprise"
      ? "entreprise"
      : audience === "cif"
        ? "cif"
      : audience === "comptable"
        ? "comptable"
        : "agence");

  const allTypesCompliant = sequenceTypes.every((type) =>
    typeCompliesWithPattern(type, category),
  );
  const safety = allTypesCompliant ? "on" : "off";
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "8b6caf",
    },
    body: JSON.stringify({
      sessionId: "8b6caf",
      location: "lib/admin/email-sequences/safety.ts:evaluateSequenceSafety",
      message: "sequence safety result",
      data: {
        slug: entry.slug,
        audience,
        safety,
        types: sequenceTypes,
        validFamilies: sequenceTypesFormValidFamilies(sequenceTypes),
        hypothesisId: "E,F",
      },
      timestamp: Date.now(),
      hypothesisId: "E,F",
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
  return safety;
}

export const SAFETY_LABELS: Record<Exclude<SequenceSafety, null>, string> = {
  on: "ON",
  off: "OFF",
};
