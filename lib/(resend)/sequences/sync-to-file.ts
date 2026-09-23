import type { Niche } from "@/lib/legacy/admin/navigation";
import type { BookingEmailType } from "@/lib/legacy/booking-communication/types";

import { writeResendSequenceFile, type SequenceFileStep } from "./file-io";

export function syncBookingSequenceToFile(options: {
  niche: Niche;
  slug: string;
  emailTypes: BookingEmailType[];
  stepMeta: Array<{ id: string; label: string; delay: string }>;
  templates: Array<{ email_type: string; subject: string; body: string }>;
}): void {
  const byType = new Map(options.templates.map((row) => [row.email_type, row]));
  const steps: SequenceFileStep[] = options.stepMeta.map((meta, index) => {
    const emailType = options.emailTypes[index];
    const row = emailType ? byType.get(emailType) : undefined;
    return {
      id: meta.id,
      label: meta.label,
      delay: meta.delay,
      subject: row?.subject ?? "",
      emailType,
      body: row?.body ?? "",
      bodyFormat: "text",
    };
  });
  writeResendSequenceFile({
    slug: options.slug,
    provider: "resend",
    niche: options.niche,
    steps,
  });
}
