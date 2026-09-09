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
      : audience === "comptable"
        ? "comptable"
        : "agence");

  const allTypesCompliant = sequenceTypes.every((type) =>
    typeCompliesWithPattern(type, category),
  );
  return allTypesCompliant ? "on" : "off";
}

export const SAFETY_LABELS: Record<Exclude<SequenceSafety, null>, string> = {
  on: "ON",
  off: "OFF",
};
