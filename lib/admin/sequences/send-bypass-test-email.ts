import { sendBookingEmail } from "@/lib/booking-communication/send";
import {
  buildTemplateVariables,
  loadTemplate,
  renderTemplate,
} from "@/lib/instantly-bypass/templates";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";
import type { Niche } from "@/lib/admin/navigation";
import { isLeadCategory } from "@/lib/link-tracking/types";

import { resolveTestLeadForCategory } from "./resolve-test-lead";

function nicheToCategory(niche: Niche) {
  return niche === "entreprise" ? "entreprise" : niche;
}

function sampleReservationLinks(category: ReturnType<typeof nicheToCategory>) {
  const base = "https://www.hercule.dev/r";
  return {
    reservation_agence_link: `${base}/agence/test`,
    reservation_entreprise_link: `${base}/entreprise/test`,
    reservation_comptable_link: `${base}/comptable/test`,
    reservation_cif_link: `${base}/cif/test`,
    first_name: "Test",
    company_name: category === "cif" ? "Cabinet Test" : "Entreprise Test",
  };
}

export async function sendBypassSequenceTestEmail(params: {
  campaignId: string;
  templateKey: BypassTemplateKey;
  niche: Niche;
  recipientEmail: string;
  subject?: string;
  bodyHtml?: string;
}): Promise<{ ok: true; resendEmailId: string; subject: string }> {
  const recipient = params.recipientEmail.trim().toLowerCase();
  if (!recipient) {
    throw new Error("recipient_email_required");
  }

  const category = nicheToCategory(params.niche);
  if (!isLeadCategory(category)) {
    throw new Error("unsupported_category");
  }

  const lead = await resolveTestLeadForCategory(category);
  const template =
    params.bodyHtml?.trim()
      ? {
          template_key: params.templateKey,
          subject: params.subject ?? "",
          body_html: params.bodyHtml,
        }
      : await loadTemplate(params.campaignId, params.templateKey);

  const payload = sampleReservationLinks(category);
  const vars = buildTemplateVariables(payload, lead ?? undefined);
  const rendered = renderTemplate(template, vars);

  const idempotencyKey = `bypass-sequence-test:${params.campaignId}:${params.templateKey}:${recipient}:${Date.now()}`;
  const text = rendered.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const result = await sendBookingEmail({
    to: recipient,
    subject: `[Test bypass] ${rendered.subject}`,
    text,
    html: rendered.html,
    idempotencyKey,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  return {
    ok: true,
    resendEmailId: result.id,
    subject: rendered.subject,
  };
}
