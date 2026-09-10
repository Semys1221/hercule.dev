import {
  getOpportunityCardBlueprints,
  type OpportunityCardBlueprint,
} from "@/lib/admin/funnels/opportunity-card-blueprints";
import type { Audience } from "@/lib/admin/navigation";
import {
  budgetKindFromPrestationType,
  computeBudgetTiers,
  computeDuration,
  computeHorizon,
  computeTaille,
  computeTimingOffsets,
  HERCULE_FLOOR_CENTS,
  STRETCH_RATIO,
  TIMING_CLASS_RANK,
  resolveBudgetFloorCents,
} from "@/lib/admin/funnels/opportunity-card-formulas";
import type { PresetOpportunityCard } from "@/lib/admin/funnels/sales-preset-registry";
import type { AgencyPresetId } from "@/lib/admin/funnels/sales-preset-scoring";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { SECTEUR_CONFIG } from "@/lib/agence/secteur-config";

export {
  HERCULE_FLOOR_CENTS,
  computeBudgetTiers,
  resolveBudgetFloorCents,
} from "@/lib/admin/funnels/opportunity-card-formulas";

const BANNED_HYPE_PATTERNS = [
  /roas positif/i,
  /sans interruption/i,
  /\bgaranti\b/i,
  /\bassuré\b/i,
  /\bdevis\b/i,
];

type MatchTier = "direct" | "adjacent" | "stretch";

type ScoredBlueprint = {
  blueprint: OpportunityCardBlueprint;
  tier: MatchTier;
  score: number;
};

const budgetFormatter = new Intl.NumberFormat("fr-FR");

export function formatOpportunityBudget(
  cents: number,
  kind: BudgetKind,
): string {
  const formatted = `${budgetFormatter.format(cents / 100)} €`;
  if (kind === "monthly") {
    return `${formatted} / mois`;
  }
  if (kind === "annual") {
    return `${formatted} / an`;
  }
  return formatted;
}

function classifyBlueprint(
  blueprint: OpportunityCardBlueprint,
  values: SalesQualificationValues,
  presetId: AgencyPresetId,
): ScoredBlueprint {
  const serviceMatch = blueprint.services.some((service) => values.q1.includes(service));
  const operationMatch = blueprint.operations.some((operation) =>
    values.q19.includes(operation),
  );
  const presetMatch = blueprint.presetAffinity.includes(presetId);

  let tier: MatchTier;
  let score: number;

  if (serviceMatch && operationMatch) {
    tier = "direct";
    score = 100;
  } else if (serviceMatch || operationMatch) {
    tier = "adjacent";
    score = 60;
  } else if (presetMatch) {
    tier = "stretch";
    score = 30;
  } else {
    tier = "stretch";
    score = 10;
  }

  if (presetMatch) {
    score += 15;
  }

  return { blueprint, tier, score };
}

function hasUniqueCopy(
  blueprint: OpportunityCardBlueprint,
  selected: OpportunityCardBlueprint[],
): boolean {
  const fields = [blueprint.prestation, blueprint.historiqueAgences];

  for (const existing of selected) {
    if (
      fields.includes(existing.prestation) ||
      fields.includes(existing.historiqueAgences)
    ) {
      return false;
    }
  }

  return true;
}

function selectBlueprints(
  values: SalesQualificationValues,
  presetId: AgencyPresetId,
  audience: Audience = "agence",
): OpportunityCardBlueprint[] {
  const blueprints = getOpportunityCardBlueprints(audience);
  const scored = blueprints.map((blueprint) =>
    classifyBlueprint(blueprint, values, presetId),
  );

  const serviceFiltered = scored.filter(
    ({ blueprint }) =>
      blueprint.services.some((service) => values.q1.includes(service)) ||
      blueprint.operations.some((operation) => values.q19.includes(operation)),
  );

  const pool = serviceFiltered.length >= 5 ? serviceFiltered : scored;

  const tiersNeeded: MatchTier[] = ["direct", "direct", "direct", "adjacent", "stretch"];
  const selected: OpportunityCardBlueprint[] = [];
  const usedSecteurs = new Set<string>();

  function pickFromPool(
    filter: (item: ScoredBlueprint) => boolean,
  ): OpportunityCardBlueprint | null {
    const candidates = pool
      .filter(
        (item) =>
          filter(item) &&
          !usedSecteurs.has(item.blueprint.secteur) &&
          !selected.some((existing) => existing.id === item.blueprint.id) &&
          hasUniqueCopy(item.blueprint, selected),
      )
      .sort((a, b) => b.score - a.score);

    return candidates[0]?.blueprint ?? null;
  }

  function pickFromTier(tier: MatchTier): boolean {
    const blueprint = pickFromPool((item) => item.tier === tier);
    if (!blueprint) return false;
    selected.push(blueprint);
    usedSecteurs.add(blueprint.secteur);
    return true;
  }

  for (const tier of tiersNeeded) {
    if (!pickFromTier(tier)) {
      const fallback = pickFromPool(() => true);
      if (!fallback) break;
      selected.push(fallback);
      usedSecteurs.add(fallback.secteur);
    }
  }

  while (selected.length < 5) {
    const fallback = pickFromPool(() => true);
    if (!fallback) break;
    selected.push(fallback);
    usedSecteurs.add(fallback.secteur);
  }

  return selected;
}

function pickDelayedIndex(blueprints: OpportunityCardBlueprint[]): number {
  return blueprints.reduce((bestIndex, blueprint, index) => {
    const rank = TIMING_CLASS_RANK[blueprint.timingClass];
    const bestRank = TIMING_CLASS_RANK[blueprints[bestIndex]?.timingClass ?? "fast"];
    return rank > bestRank ? index : bestIndex;
  }, 0);
}

function blueprintToCard(
  blueprint: OpportunityCardBlueprint,
  budgetCents: number,
  delayed: boolean,
  index: number,
  slot: number,
  values: SalesQualificationValues,
  presetId: AgencyPresetId,
  floorCents: number,
  audience: Audience = "agence",
): PresetOpportunityCard {
  const budgetKind = budgetKindFromPrestationType(blueprint.prestationType, audience);
  const timing = computeTimingOffsets(blueprint.timingClass, delayed);

  return {
    id: `${blueprint.id}-${index}`,
    secteur: blueprint.secteur,
    zone: blueprint.zone,
    prestation: blueprint.prestation,
    budget: formatOpportunityBudget(budgetCents, budgetKind),
    budgetCents,
    budgetKind,
    taille: computeTaille(
      values.q11,
      blueprint.tailleClass,
      index,
      presetId,
      audience,
    ),
    dureeSouhaitee: computeDuration(
      blueprint.prestationType,
      budgetCents,
      floorCents,
      values,
      slot,
    ),
    horizonResultat: computeHorizon(
      blueprint.prestationType,
      budgetCents,
      floorCents,
      slot,
    ),
    historiqueAgences: blueprint.historiqueAgences,
    companyNameBlurred: blueprint.companyNameBlurred,
    domainBlurred: blueprint.domainBlurred,
    contactEmail: blueprint.contactEmail,
    contactPhone: blueprint.contactPhone,
    minDaysOffset: timing.min,
    maxDaysOffset: timing.max,
  };
}

export function composeOpportunityCards(
  values: SalesQualificationValues,
  presetId: AgencyPresetId,
  audience: Audience = "agence",
): PresetOpportunityCard[] {
  const blueprints = selectBlueprints(values, presetId, audience);
  const floorCents = resolveBudgetFloorCents(values, presetId, audience);
  const budgetTiers = computeBudgetTiers(floorCents);
  const delayedIndex = pickDelayedIndex(blueprints);

  const orderedIndexes = blueprints.map((_, index) => index);
  const stretchIndex = delayedIndex;
  const remaining = orderedIndexes.filter((index) => index !== stretchIndex);
  const slotByBlueprintIndex = new Map<number, number>();
  remaining.forEach((blueprintIndex, slot) => {
    slotByBlueprintIndex.set(blueprintIndex, slot);
  });
  slotByBlueprintIndex.set(stretchIndex, 4);

  const cards = blueprints.map((blueprint, index) => {
    const slot = slotByBlueprintIndex.get(index) ?? index;
    return blueprintToCard(
      blueprint,
      budgetTiers[slot] ?? budgetTiers[budgetTiers.length - 1],
      index === delayedIndex,
      index,
      slot,
      values,
      presetId,
      floorCents,
      audience,
    );
  });

  validateOpportunityCardSet(cards, floorCents);
  return cards;
}

export function validateOpportunityCardSet(
  cards: PresetOpportunityCard[],
  floorCents: number = HERCULE_FLOOR_CENTS,
): void {
  if (cards.length !== 5) {
    throw new Error(`Expected 5 cards, got ${cards.length}`);
  }

  const secteurs = cards.map((card) => card.secteur);
  if (new Set(secteurs).size !== 5) {
    throw new Error("Expected 5 distinct secteurs");
  }

  for (const secteur of secteurs) {
    if (!SECTEUR_CONFIG[secteur]) {
      throw new Error(`Unknown secteur: ${secteur}`);
    }
  }

  const budgets = cards.map((card) => card.budgetCents);
  if (budgets.some((cents) => cents < floorCents)) {
    throw new Error("Budget below resolved floor");
  }

  const stretchCards = cards.filter(
    (card) => card.budgetCents >= floorCents * 1.55,
  );
  if (stretchCards.length !== 1) {
    throw new Error(
      `Expected exactly 1 stretch budget (>= ${floorCents * 1.55}), got ${stretchCards.length}`,
    );
  }

  const delayedCards = cards.filter((card) => card.maxDaysOffset >= 30);
  if (delayedCards.length !== 1) {
    throw new Error(`Expected exactly 1 delayed card, got ${delayedCards.length}`);
  }

  if (stretchCards[0].id !== delayedCards[0].id) {
    throw new Error("Stretch budget card must also be the delayed card");
  }

  const copyFields = cards.flatMap((card) => [
    card.prestation,
    card.dureeSouhaitee,
    card.horizonResultat,
    card.historiqueAgences,
  ]);
  if (new Set(copyFields).size !== copyFields.length) {
    const dupes = copyFields.filter((field, index) => copyFields.indexOf(field) !== index);
    throw new Error(`Duplicate copy fields in card set: ${JSON.stringify(dupes)}`);
  }

  for (const card of cards) {
    for (const field of [
      card.prestation,
      card.dureeSouhaitee,
      card.horizonResultat,
      card.historiqueAgences,
    ]) {
      for (const pattern of BANNED_HYPE_PATTERNS) {
        if (pattern.test(field)) {
          throw new Error(`Banned copy pattern in card ${card.id}: ${field}`);
        }
      }
    }
  }
}

export function isStretchBudget(budgetCents: number, floorCents: number): boolean {
  return budgetCents >= floorCents * (STRETCH_RATIO - 0.1);
}
