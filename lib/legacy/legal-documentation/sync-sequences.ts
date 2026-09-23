import type { Niche } from "@/lib/legacy/admin/navigation";
import type { BypassTemplateKey } from "@/lib/legacy/instantly-bypass/types";
import { writeSequenceFile, type SequenceFileStep } from "@/lib/legacy/legal-documentation/sequences";

export { syncBookingSequenceToFile } from "@/lib/(resend)/sequences/sync-to-file";

export function syncBypassSequenceToFile(options: {
  niche: Niche;
  slug: string;
  campaignId: string;
  templateKeys: BypassTemplateKey[];
  stepMeta: Array<{ id: string; label: string; delay: string; templateKey: BypassTemplateKey }>;
  templates: Array<{ template_key: string; subject: string; body_html: string }>;
}): void {
  const byKey = new Map(options.templates.map((row) => [row.template_key, row]));
  const steps: SequenceFileStep[] = options.stepMeta.map((meta) => {
    const row = byKey.get(meta.templateKey);
    return {
      id: meta.id,
      label: meta.label,
      delay: meta.delay,
      subject: row?.subject ?? "",
      templateKey: meta.templateKey,
      body: row?.body_html ?? "",
      bodyFormat: "html",
    };
  });
  writeSequenceFile({
    slug: options.slug,
    provider: "instantly_bypass",
    niche: options.niche,
    campaignId: options.campaignId,
    templateKeys: options.templateKeys,
    steps,
  });
}

export function syncColdOutreachToFile(options: {
  niche: Niche;
  campaignId?: string;
  steps: Array<{
    id: string;
    label: string;
    delay: string;
    subject: string;
    body: string;
  }>;
}): void {
  writeSequenceFile({
    slug: "cold-email",
    provider: "instantly",
    niche: options.niche,
    campaignId: options.campaignId,
    steps: options.steps.map((step) => ({
      id: step.id,
      label: step.label,
      delay: step.delay,
      subject: step.subject,
      body: step.body,
      bodyFormat: "text",
    })),
  });
}

export function syncReplyAgentSequenceToFile(options: {
  niche: Niche;
  slug: string;
  campaignId: string;
  promptSnapshot: string;
}): void {
  writeSequenceFile({
    slug: options.slug,
    provider: "reply_agent",
    niche: options.niche,
    campaignId: options.campaignId,
    promptSnapshot: options.promptSnapshot,
    steps: [
      {
        id: "prompt",
        label: "Prompt",
        delay: "—",
        subject: "Prompt",
        body: options.promptSnapshot,
        bodyFormat: "text",
      },
    ],
  });
}
