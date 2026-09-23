import type { Audience, Niche } from "@/lib/legacy/admin/navigation";

import { bookingSequenceTypesFor } from "./booking-slugs";
import { RESEND_EMAIL_SEQUENCES } from "./entries";
import type { EmailSequenceEntry } from "./entries";

export type { EmailSequenceEntry } from "./entries";
export { RESEND_EMAIL_SEQUENCES } from "./entries";
export { BOOKING_SEQUENCE_SLUGS, bookingSequenceTypesFor } from "./booking-slugs";

export function listResendBookingSequences(): EmailSequenceEntry[] {
  return RESEND_EMAIL_SEQUENCES.filter(
    (entry) => entry.provider === "resend" && entry.editorKind === "booking",
  );
}

export function getResendSequence(slug: string): EmailSequenceEntry | null {
  return (
    RESEND_EMAIL_SEQUENCES.find(
      (entry) => entry.slug === slug && entry.provider === "resend",
    ) ?? null
  );
}

export function resendSequencesForAudience(audience: Audience): EmailSequenceEntry[] {
  return listResendBookingSequences().filter((entry) =>
    entry.audiences.includes(audience as Niche),
  );
}

export { bookingSequenceTypesFor as bookingTypesFor };
