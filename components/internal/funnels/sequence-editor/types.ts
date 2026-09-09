import type { BookingEmailType } from "@/lib/booking-communication/types";
import type { Niche } from "@/lib/admin/navigation";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

export type SequenceStep = {
  id: string;
  label: string;
  delay: string;
  subject: string;
  body: string;
  bodyFormat?: "text" | "html";
  /** When true, subject is set at send time (Re: root subject). */
  subjectManaged?: boolean;
};

export type SequenceHistoryFilter = {
  emailTypes?: BookingEmailType[];
  templateKeys?: BypassTemplateKey[];
};

export type SequenceEditorAdapter = {
  slug: string;
  niche: Niche;
  provider: "resend" | "instantly";
  load(): Promise<SequenceStep[]>;
  save(steps: SequenceStep[]): Promise<void>;
  preview?(stepId: string, steps: SequenceStep[]): Promise<{ subject: string; body: string; html?: string }>;
  loadVariables(): Promise<string[]>;
  historyFilter(): SequenceHistoryFilter;
};
