import type {
  PropositionBlock,
  PropositionConfig,
  PropositionPricing,
  PropositionRecapSlide,
  PropositionRoi,
} from "@/lib/legacy/propositions/schema";

export type PropositionStepKind = "recap" | "proposal-block" | "roi" | "pricing" | "payment";

export type PropositionStep =
  | { kind: "recap"; id: string; slide: PropositionRecapSlide }
  | { kind: "proposal-block"; id: string; block: PropositionBlock }
  | { kind: "roi"; id: string; roi: PropositionRoi }
  | { kind: "pricing"; id: string; pricing: PropositionPricing }
  | { kind: "payment"; id: string; stripePaymentLinkUrl: string };

export function buildPropositionSteps(config: PropositionConfig): PropositionStep[] {
  const steps: PropositionStep[] = [];

  for (const slide of config.recap) {
    steps.push({
      kind: "recap",
      id: `recap-${slide.id}`,
      slide,
    });
  }

  for (const block of config.proposal.blocks) {
    steps.push({
      kind: "proposal-block",
      id: `proposal-${block.id}`,
      block,
    });
  }

  steps.push({
    kind: "roi",
    id: "proposal-roi",
    roi: config.proposal.roi,
  });

  steps.push({
    kind: "pricing",
    id: "proposal-pricing",
    pricing: config.proposal.pricing,
  });

  steps.push({
    kind: "payment",
    id: "payment",
    stripePaymentLinkUrl: config.payment.stripePaymentLinkUrl,
  });

  return steps;
}

export function stepRequiresValidation(step: PropositionStep): boolean {
  return step.kind !== "payment";
}

export function getStepPhaseLabel(step: PropositionStep): string {
  if (step.kind === "recap") {
    return "Récapitulatif";
  }
  if (step.kind === "payment") {
    return "Paiement";
  }
  return "Proposition";
}
