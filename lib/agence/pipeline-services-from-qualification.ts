import { getSalesQuestions } from "@/components/internal/funnels/sales/sales-questions";
import { formatQuestionAnswerValue } from "@/lib/admin/funnels/sales-qualification-display";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";

const CALENDLY_SERVICE_QUESTION_KEYS = [
  "service",
  "services",
  "activité",
  "activite",
  "prestation",
  "prestations",
  "expertise",
  "positionnement",
  "offre",
  "marketing digital",
];

function normalizeQuestionText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function matchCalendlyServiceAnswer(
  questions: Record<string, string> | null | undefined,
): string {
  if (!questions) {
    return "";
  }

  for (const [question, answer] of Object.entries(questions)) {
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      continue;
    }

    const normalizedQuestion = normalizeQuestionText(question);
    if (
      CALENDLY_SERVICE_QUESTION_KEYS.some((key) =>
        normalizedQuestion.includes(normalizeQuestionText(key)),
      )
    ) {
      return trimmedAnswer;
    }
  }

  return "";
}

/** Maps Calendly invitee Q&A (booking API) to the Revente wizard services field. */
export function pipelineServicesFromCalendlyQuestions(
  questions: Record<string, string> | null | undefined,
): string {
  return matchCalendlyServiceAnswer(questions);
}

/** Maps session q1 (services multi-select) to the Revente wizard free-text field. */
export function pipelineServicesFromSessionQualification(
  values: Partial<SalesQualificationValues> | null | undefined,
): string {
  const selected = values?.q1;
  if (!Array.isArray(selected) || selected.length === 0) {
    return "";
  }

  const q1 = getSalesQuestions("agence").find((question) => question.id === "q1");
  if (!q1) {
    return "";
  }

  const formatted = formatQuestionAnswerValue(q1, values as SalesQualificationValues);
  return formatted === "—" ? "" : formatted;
}

export function resolvePipelineInitialServices(options: {
  bookingQuestions?: Record<string, string> | null;
  leadQuestions?: Record<string, string> | null;
  qualificationValues?: Partial<SalesQualificationValues> | null;
}): string {
  return (
    pipelineServicesFromCalendlyQuestions(options.bookingQuestions) ||
    pipelineServicesFromCalendlyQuestions(options.leadQuestions) ||
    pipelineServicesFromSessionQualification(options.qualificationValues)
  );
}
