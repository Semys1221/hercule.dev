import type { BookingEmailType } from "@/lib/booking-communication/types";
import { followUpRequiresEmptySubject } from "@/lib/booking-communication/sequence-pattern";
import { validateSequenceCopy } from "@/lib/admin/niches/sequence-variables";
import type { Niche } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";

import type { SequenceEditorAdapter, SequenceStep } from "../types";

type BookingAdapterOptions = {
  slug: string;
  niche: Niche;
  category: LeadCategory;
  emailTypes: BookingEmailType[];
  stepMeta: Array<{ id: string; label: string; delay: string }>;
};

export function createBookingAdapter(options: BookingAdapterOptions): SequenceEditorAdapter {
  const { slug, niche, category, emailTypes, stepMeta } = options;

  return {
    slug,
    niche,
    provider: "resend",
    historyFilter: () => ({ emailTypes }),
    async loadVariables() {
      const response = await fetch(`/api/admin/niches/${niche}/variables`);
      const body = (await response.json()) as { variables?: string[]; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Variables indisponibles");
      }
      return body.variables ?? [];
    },
    async load() {
      const response = await fetch(`/api/admin/booking-templates/${category}`);
      const body = (await response.json()) as {
        templates?: Array<{ email_type: string; subject: string; body: string }>;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      const byType = new Map(
        (body.templates ?? []).map((row) => [row.email_type, row]),
      );
      return stepMeta.map((meta, index) => {
        const emailType = emailTypes[index];
        const row = byType.get(emailType);
        return {
          id: meta.id,
          label: meta.label,
          delay: meta.delay,
          subject: row?.subject ?? "",
          body: row?.body ?? "",
          bodyFormat: "text",
          subjectManaged: followUpRequiresEmptySubject(emailType),
        };
      });
    },
    async save(steps: SequenceStep[]) {
      const variables = await this.loadVariables();
      const validation = validateSequenceCopy(variables, steps);
      if (!validation.ok) {
        throw new Error(
          `Variables inconnues : ${validation.unknown.map((key) => `{{${key}}}`).join(", ")}`,
        );
      }

      const templates = steps.map((step, index) => ({
        email_type: emailTypes[index],
        subject: followUpRequiresEmptySubject(emailTypes[index])
          ? ""
          : step.subject,
        body: step.body,
      }));
      const response = await fetch(`/api/admin/booking-templates/${category}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
    },
    async preview(stepId: string, steps: SequenceStep[]) {
      const index = stepMeta.findIndex((meta) => meta.id === stepId);
      if (index < 0) {
        throw new Error("Step introuvable");
      }
      const step = steps[index];
      const response = await fetch("/api/admin/booking-templates/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          emailType: emailTypes[index],
          subject: step.subject,
          body: step.body,
        }),
      });
      const body = (await response.json()) as {
        subject?: string;
        text?: string;
        html?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Prévisualisation impossible");
      }
      return {
        subject: body.subject ?? step.subject,
        body: body.text ?? step.body,
        html: body.html,
      };
    },
  };
}
