import { deleteBookingEmailTemplates } from "@/lib/(resend)/communication/template-store";
import { deleteResendSequenceFile } from "@/lib/(resend)/sequences/file-io";
import { removeResendSequenceFromRegistry } from "@/lib/(resend)/sequences/remove-from-registry";
import {
  bookingSequenceTypesFor,
  getResendSequence,
} from "@/lib/(resend)/sequences/registry";
import type { Niche } from "@/lib/legacy/admin/navigation";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";
import { isLeadCategory, type LeadCategory } from "@/lib/legacy/link-tracking/types";

export async function deleteResendSequence(slug: string): Promise<void> {
  const sequence = getResendSequence(slug);
  if (!sequence || sequence.editorKind !== "booking") {
    throw new Error("sequence_not_found");
  }

  const emailTypes = new Set<BookingEmailType>();
  for (const audience of sequence.audiences) {
    for (const emailType of bookingSequenceTypesFor(slug, audience as Niche)) {
      emailTypes.add(emailType);
    }
  }

  for (const audience of sequence.audiences) {
    if (!isLeadCategory(audience)) continue;
    await deleteBookingEmailTemplates(audience as LeadCategory, [...emailTypes]);
    deleteResendSequenceFile(audience as Niche, slug);
  }

  removeResendSequenceFromRegistry(slug);
}
