const Q11_SEGMENT_LABELS: Record<string, string> = {
  freelancers: "indépendants",
  tpe: "TPE",
  pme_small: "PME",
  pme_medium: "PME",
  eti: "ETI",
  enterprise: "grandes structures",
};

const DEFAULT_CLIENT_SEGMENT_LABEL = "TPE";

export type ClientSegment = {
  active: boolean;
  label: string;
};

export function resolveClientSegment(q11: string[] | undefined): ClientSegment {
  const selected = (q11 ?? []).filter(Boolean);
  if (selected.length === 0) {
    return { active: false, label: DEFAULT_CLIENT_SEGMENT_LABEL };
  }

  const labels = [...new Set(selected.map((id) => Q11_SEGMENT_LABELS[id]).filter(Boolean))];
  if (labels.length === 0) {
    return { active: false, label: DEFAULT_CLIENT_SEGMENT_LABEL };
  }

  return {
    active: true,
    label: labels.join(" / "),
  };
}

export function interpolateClientSegment(
  text: string,
  segment: ClientSegment,
): string {
  return text.replaceAll("{clientSegment}", segment.label);
}

type InterpolatableQuestion = {
  prompt: string;
  description?: string;
  options?: Array<{ label: string }>;
};

export function interpolateQuestionCopy<T extends InterpolatableQuestion>(
  question: T,
  segment: ClientSegment,
): T {
  return {
    ...question,
    prompt: interpolateClientSegment(question.prompt, segment),
    description: question.description
      ? interpolateClientSegment(question.description, segment)
      : undefined,
    options: question.options?.map((option) => ({
      ...option,
      label: interpolateClientSegment(option.label, segment),
    })) as T["options"],
  };
}

export const COMPTABLE_Q11_DISABLED_OPTION_IDS = new Set(["eti", "enterprise"]);

export function sanitizeComptableQ11Selection(q11: string[]): string[] {
  return q11.filter((id) => !COMPTABLE_Q11_DISABLED_OPTION_IDS.has(id));
}
