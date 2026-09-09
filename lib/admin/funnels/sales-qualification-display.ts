import {
  formatSliderLabel,
  getSalesQuestions,
  type SalesQuestion,
} from "@/components/internal/funnels/sales/sales-questions";
import type { SalesClosingValues } from "@/components/internal/funnels/sales/sales-closing-sections";
import {
  mergeSalesQualificationValues,
  SALES_SKIP_VALUE,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import type { Audience } from "@/lib/admin/navigation";

export type FormattedAnswerRow = {
  id: string;
  question: string;
  answer: string;
};

export type SalesSessionStorageRow = {
  label: string;
  value: string;
};

function formatBooleanAnswer(value: unknown): string {
  return value === true ? "Oui" : value === false ? "Non" : "—";
}

export function formatQuestionAnswerValue(
  question: SalesQuestion,
  values: SalesQualificationValues,
): string {
  const raw = values[question.id as keyof SalesQualificationValues];

  if (question.type === "multi" && Array.isArray(raw)) {
    const labels = raw.map(
      (id) => question.options.find((option) => option.id === id)?.label ?? id,
    );
    if (question.id === "q2" && raw.includes("other") && values.q2Other?.trim()) {
      labels.push(`Autre : ${values.q2Other.trim()}`);
    }
    return labels.join(", ") || "—";
  }

  if (question.type === "single" && typeof raw === "string") {
    return (question.options.find((option) => option.id === raw)?.label ?? raw) || "—";
  }

  if (question.type === "slider") {
    if (raw === null) {
      return question.optOutLabel ?? "—";
    }
    if (typeof raw === "number") {
      return formatSliderLabel(raw, question.slider.unit);
    }
  }

  if (
    question.type === "slider_matrix" &&
    typeof raw === "object" &&
    raw !== null &&
    !Array.isArray(raw)
  ) {
    const matrix = raw as SalesQualificationValues["q14"];
    return question.subQuestions
      .map((sub) => `${sub.label} : ${formatSliderLabel(matrix[sub.id], question.slider.unit)}`)
      .join(" · ");
  }

  if (question.type === "conditional_slider") {
    if (raw === SALES_SKIP_VALUE) {
      return question.skipLabel;
    }
    if (typeof raw === "number") {
      return formatSliderLabel(raw, question.slider.unit);
    }
  }

  if (typeof raw === "boolean") {
    return formatBooleanAnswer(raw);
  }

  return raw === null || raw === undefined || raw === "" ? "—" : String(raw);
}

function hasMeaningfulAnswer(answer: string): boolean {
  return answer !== "—";
}

export function formatQualificationAnswers(
  audience: Audience,
  rawQualification: Record<string, unknown> | undefined | null,
): FormattedAnswerRow[] {
  if (!rawQualification || Object.keys(rawQualification).length === 0) {
    return [];
  }

  const values = mergeSalesQualificationValues(
    rawQualification as Partial<SalesQualificationValues>,
    audience,
  );
  const rows: FormattedAnswerRow[] = [];

  if ("introConfirmed" in rawQualification) {
    rows.push({
      id: "introConfirmed",
      question: "Introduction confirmée",
      answer: formatBooleanAnswer(rawQualification.introConfirmed),
    });
  }

  if ("presentationConfirmed" in rawQualification) {
    rows.push({
      id: "presentationConfirmed",
      question: "Présentation société confirmée",
      answer: formatBooleanAnswer(rawQualification.presentationConfirmed),
    });
  }

  for (const question of getSalesQuestions(audience)) {
    const answer = formatQuestionAnswerValue(question, values);
    if (question.id in rawQualification && hasMeaningfulAnswer(answer)) {
      rows.push({
        id: question.id,
        question: question.prompt,
        answer,
      });
    }
  }

  return rows;
}

export function formatClosingAnswers(
  rawClosing: Record<string, unknown> | undefined | null,
): FormattedAnswerRow[] {
  if (!rawClosing || Object.keys(rawClosing).length === 0) {
    return [];
  }

  const closing = rawClosing as Partial<SalesClosingValues>;
  const rows: FormattedAnswerRow[] = [];

  if ("reglesAccepted" in rawClosing) {
    rows.push({
      id: "reglesAccepted",
      question: "Règles de traitement acceptées",
      answer: formatBooleanAnswer(closing.reglesAccepted),
    });
  }

  if ("calendrierAccepted" in rawClosing) {
    rows.push({
      id: "calendrierAccepted",
      question: "Calendrier de collaboration accepté",
      answer: formatBooleanAnswer(closing.calendrierAccepted),
    });
  }

  return rows;
}

export function getQuestionDefinitionsPath(audience: Audience): string {
  if (audience === "comptable") {
    return "components/internal/funnels/sales/sales-questions-comptable.ts";
  }
  if (audience === "entreprise") {
    return "components/internal/funnels/sales/sales-questions.ts + sales-questions-objectifs-entreprise.ts";
  }
  return "components/internal/funnels/sales/sales-questions.ts + sales-questions-objectifs-agence.ts";
}

export function getSalesSessionStorageRows(params: {
  audience: Audience;
  salesCallId: string | null;
  inviteeUri: string | null;
  leadCategory: string | null;
}): SalesSessionStorageRow[] {
  const rows: SalesSessionStorageRow[] = [
    {
      label: "Qualification + closing",
      value: "Supabase › public.sales_calls › notes",
    },
  ];

  if (params.salesCallId) {
    rows.push({
      label: "Identifiant ligne",
      value: `sales_calls.id = ${params.salesCallId}`,
    });
  }

  if (params.inviteeUri) {
    rows.push({
      label: "Clé Calendly",
      value: `calendly_invitee_uri = ${params.inviteeUri}`,
    });
  }

  rows.push(
    { label: "Qualification JSON", value: "notes.qualification" },
    { label: "Closing JSON", value: "notes.closing" },
  );

  if (params.leadCategory === "agence") {
    rows.push({
      label: "Sync agence (si qualification sauvegardée)",
      value: "agence.profile.form",
    });
  }

  rows.push({
    label: "Définitions questions (code)",
    value: getQuestionDefinitionsPath(params.audience),
  });

  return rows;
}
