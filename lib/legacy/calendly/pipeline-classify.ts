export type PipelineNiche = "comptable" | "cif";

export type BudgetTier = "undefined" | "1000plus";

export type PipelineInviteeSegment = {
  niche: PipelineNiche;
  isComptable: boolean;
  isIndependent: boolean;
  budgetTier: BudgetTier;
  segmentKey: string;
  segmentLabel: string;
};

const TEAM_SIZE_KEYS = [
  "effectif",
  "salarié",
  "salariés",
  "équipe",
  "equipe",
  "taille",
  "collaborateur",
];

const BUDGET_KEYS = ["budget", "999", "investir", "panier", "tarif"];

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function matchQuestionAnswer(
  questions: Record<string, string>,
  keys: string[],
): string | null {
  for (const [question, answer] of Object.entries(questions)) {
    const normalizedQuestion = normalizeText(question);
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) {
      continue;
    }
    if (keys.some((key) => normalizedQuestion.includes(normalizeText(key)))) {
      return trimmedAnswer;
    }
  }
  return null;
}

function isIndependentFromAnswer(answer: string | null): boolean {
  if (!answer) {
    return false;
  }
  return normalizeText(answer).includes("independant");
}

function budgetTierFromComptableAnswer(answer: string | null): BudgetTier {
  if (!answer) {
    return "undefined";
  }
  const normalized = normalizeText(answer);
  if (normalized === "oui") {
    return "1000plus";
  }
  if (normalized === "non") {
    return "undefined";
  }
  return "undefined";
}

function budgetTierFromCifAnswer(answer: string | null): BudgetTier {
  if (!answer) {
    return "undefined";
  }
  const normalized = normalizeText(answer);
  if (normalized.includes("moins de 1 000") || normalized.includes("moins de 1000")) {
    return "undefined";
  }
  if (
    normalized.includes("entre 1 000") ||
    normalized.includes("entre 1000") ||
    normalized.includes("plus de 2 500") ||
    normalized.includes("plus de 2500")
  ) {
    return "1000plus";
  }
  return "undefined";
}

function segmentLabel(params: {
  budgetTier: BudgetTier;
  isIndependent: boolean;
  isComptable: boolean;
}): string {
  const budget =
    params.budgetTier === "1000plus" ? "Budget 1 000 €+" : "Budget à définir";
  const team = params.isIndependent ? "Indépendant" : "Pas indépendant";
  const niche = params.isComptable ? "Comptable" : "Pas comptable";
  return `${budget} · ${team} · ${niche}`;
}

export function classifyPipelineInvitee(
  niche: PipelineNiche,
  questions: Record<string, string>,
): PipelineInviteeSegment {
  const isComptable = niche === "comptable";
  const teamAnswer = matchQuestionAnswer(questions, TEAM_SIZE_KEYS);
  const budgetAnswer = matchQuestionAnswer(questions, BUDGET_KEYS);
  const isIndependent = isIndependentFromAnswer(teamAnswer);
  const budgetTier = isComptable
    ? budgetTierFromComptableAnswer(budgetAnswer)
    : budgetTierFromCifAnswer(budgetAnswer);

  const segmentKey = [
    budgetTier,
    isIndependent ? "indep" : "not_indep",
    isComptable ? "comptable" : "not_comptable",
  ].join("_");

  return {
    niche,
    isComptable,
    isIndependent,
    budgetTier,
    segmentKey,
    segmentLabel: segmentLabel({ budgetTier, isIndependent, isComptable }),
  };
}
