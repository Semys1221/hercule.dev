import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { Niche } from "@/lib/legacy/admin/navigation";

import { resendSequenceMarkdownPath, resendSequencesDir } from "./paths";

export type SequenceFileProvider =
  | "resend"
  | "instantly"
  | "instantly_bypass"
  | "reply_agent";

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

export const STEP_SEPARATOR = "\n\n---step---\n\n";

export function parseSequenceMarkdown(
  raw: string,
  fallback: { niche: Niche; slug: string },
): SequenceFileDocument {
  const trimmed = raw.trimStart();
  let meta: Record<string, unknown> = {};
  let body = raw;
  if (trimmed.startsWith("---")) {
    const end = trimmed.indexOf("\n---", 3);
    if (end >= 0) {
      const jsonBlock = trimmed.slice(3, end).trim();
      body = trimmed.slice(end + 4).replace(/^\n/, "");
      try {
        meta = JSON.parse(jsonBlock) as Record<string, unknown>;
      } catch {
        meta = {};
        body = raw;
      }
    }
  }

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
    slug: String(meta.slug ?? fallback.slug),
    provider: (meta.provider as SequenceFileProvider) ?? "resend",
    niche: (meta.niche as Niche) ?? fallback.niche,
    campaignId: meta.campaignId ? String(meta.campaignId) : undefined,
    templateKeys: Array.isArray(meta.templateKeys)
      ? meta.templateKeys.map(String)
      : undefined,
    promptSnapshot: meta.promptSnapshot ? String(meta.promptSnapshot) : undefined,
    steps,
  };
}

export function serializeSequenceMarkdown(document: SequenceFileDocument): string {
  const meta: Record<string, unknown> = {
    slug: document.slug,
    provider: document.provider,
    niche: document.niche,
  };
  if (document.campaignId) meta.campaignId = document.campaignId;
  if (document.templateKeys?.length) meta.templateKeys = document.templateKeys;
  if (document.promptSnapshot) meta.promptSnapshot = document.promptSnapshot;
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
  return `---\n${JSON.stringify(meta, null, 2)}\n---\n\n${body}`;
}

export function readSequenceFileAt(
  filePath: string,
  fallback: { niche: Niche; slug: string },
): SequenceFileDocument | null {
  try {
    return parseSequenceMarkdown(readFileSync(filePath, "utf-8"), fallback);
  } catch {
    return null;
  }
}

export function writeSequenceFileAt(filePath: string, document: SequenceFileDocument): void {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, serializeSequenceMarkdown(document), "utf-8");
}

export function readResendSequenceFile(
  niche: Niche,
  slug: string,
): SequenceFileDocument | null {
  return readSequenceFileAt(resendSequenceMarkdownPath(niche, slug), { niche, slug });
}

export function writeResendSequenceFile(document: SequenceFileDocument): void {
  const filePath = resendSequenceMarkdownPath(document.niche, document.slug);
  mkdirSync(resendSequencesDir(document.niche), { recursive: true });
  writeSequenceFileAt(filePath, document);
}

export function deleteResendSequenceFile(niche: Niche, slug: string): boolean {
  const filePath = resendSequenceMarkdownPath(niche, slug);
  if (!existsSync(filePath)) return false;
  unlinkSync(filePath);
  return true;
}
