import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { PaymentOnboardingVertical } from "./constants";
import type { PaymentOnboardingSequenceDocument, PaymentOnboardingSequenceStep } from "./types";

const STEP_SEPARATOR = "\n\n---step---\n\n";
const ONBOARDING_DIR = join(process.cwd(), "lib/(resend)/onboarding");

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

export function readPaymentOnboardingSequence(
  vertical: PaymentOnboardingVertical,
): PaymentOnboardingSequenceDocument {
  const path = join(ONBOARDING_DIR, `${vertical}.md`);
  const raw = readFileSync(path, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  const stepBodies = body.split(STEP_SEPARATOR);
  const stepsMeta = (meta.steps as Array<Record<string, unknown>> | undefined) ?? [];

  const steps: PaymentOnboardingSequenceStep[] = stepsMeta.map((step, index) => ({
    id: String(step.id ?? `step-${index}`),
    label: step.label ? String(step.label) : undefined,
    delay: step.delay ? String(step.delay) : undefined,
    subject: String(step.subject ?? ""),
    emailType: String(step.emailType ?? `payment_onboarding_${index + 1}`),
    bodyFormat: step.bodyFormat === "html" ? "html" : "text",
    body: (stepBodies[index] ?? "").trim(),
  }));

  return {
    slug: String(meta.slug ?? "payment-onboarding"),
    vertical: (meta.vertical as PaymentOnboardingVertical) ?? vertical,
    niche: String(meta.niche ?? vertical),
    stopOnReply: meta.stopOnReply === true,
    stopTriggers: Array.isArray(meta.stopTriggers)
      ? meta.stopTriggers.map(String)
      : [],
    steps,
  };
}
