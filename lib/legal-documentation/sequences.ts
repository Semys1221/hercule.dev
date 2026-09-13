import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Niche } from "@/lib/admin/navigation";
import { sequenceMarkdownPath, sequencesDir } from "@/lib/legal-documentation/paths";

export type SequenceFileProvider = "resend" | "instantly_bypass" | "reply_agent";

export type SequenceFileStep = {
  id: string;
  label?: string;
  delay?: string;
  subject?: string;
  emailType?: string;
  templateKey?: string;
  body: string;
  bodyFormat?: "text" | "html";
};

export type SequenceFileDocument = {
  slug: string;
  provider: SequenceFileProvider;
  niche: Niche;
  campaignId?: string;
  templateKeys?: string[];
  promptSnapshot?: string;
  steps: SequenceFileStep[];
};

const STEP_SEPARATOR = "\n\n---step---\n\n";

function parseFrontmatter(raw: string): { meta: Record<string, unknown>; body: string } {
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { meta: {}, body: raw };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) {
    return { meta: {}, body: raw };
  }
  const jsonBlock = trimmed.slice(3, end).trim();
  const body = trimmed.slice(end + 4).replace(/^\n/, "");
  try {
    return { meta: JSON.parse(jsonBlock) as Record<string, unknown>, body };
  } catch {
    return { meta: {}, body: raw };
  }
}

function serializeFrontmatter(meta: Record<string, unknown>, body: string): string {
  return `---\n${JSON.stringify(meta, null, 2)}\n---\n\n${body}`;
}

export function readSequenceFile(niche: Niche, slug: string): SequenceFileDocument | null {
  const path = sequenceMarkdownPath(niche, slug);
  try {
    const raw = readFileSync(path, "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const stepBodies = body.split(STEP_SEPARATOR);
    const stepsMeta = (meta.steps as Array<Record<string, unknown>> | undefined) ?? [];
    const steps: SequenceFileStep[] = stepsMeta.map((step, index) => ({
      id: String(step.id ?? `step-${index}`),
      label: step.label ? String(step.label) : undefined,
      delay: step.delay ? String(step.delay) : undefined,
      subject: step.subject ? String(step.subject) : undefined,
      emailType: step.emailType ? String(step.emailType) : undefined,
      templateKey: step.templateKey ? String(step.templateKey) : undefined,
      bodyFormat: step.bodyFormat === "html" ? "html" : "text",
      body: stepBodies[index] ?? "",
    }));
    return {
      slug: String(meta.slug ?? slug),
      provider: (meta.provider as SequenceFileProvider) ?? "resend",
      niche: (meta.niche as Niche) ?? niche,
      campaignId: meta.campaignId ? String(meta.campaignId) : undefined,
      templateKeys: Array.isArray(meta.templateKeys)
        ? meta.templateKeys.map(String)
        : undefined,
      promptSnapshot: meta.promptSnapshot ? String(meta.promptSnapshot) : undefined,
      steps,
    };
  } catch {
    return null;
  }
}

export function writeSequenceFile(document: SequenceFileDocument): void {
  const path = sequenceMarkdownPath(document.niche, document.slug);
  mkdirSync(dirname(path), { recursive: true });
  mkdirSync(sequencesDir(document.niche), { recursive: true });

  const meta: Record<string, unknown> = {
    slug: document.slug,
    provider: document.provider,
    niche: document.niche,
  };
  if (document.campaignId) {
    meta.campaignId = document.campaignId;
  }
  if (document.templateKeys?.length) {
    meta.templateKeys = document.templateKeys;
  }
  if (document.promptSnapshot) {
    meta.promptSnapshot = document.promptSnapshot;
  }
  meta.steps = document.steps.map((step) => ({
    id: step.id,
    label: step.label,
    delay: step.delay,
    subject: step.subject,
    emailType: step.emailType,
    templateKey: step.templateKey,
    bodyFormat: step.bodyFormat ?? "text",
  }));

  const body = document.steps.map((step) => step.body).join(STEP_SEPARATOR);
  writeFileSync(path, serializeFrontmatter(meta, body), "utf-8");
}

export function sequenceFileRelativePath(niche: Niche, slug: string): string {
  return `doc/legal-documentation/${niche}/sequences/${slug}.md`;
}
