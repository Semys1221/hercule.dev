import { describe, expect, it } from "vitest";

import cabinetExemple from "@/content/propositions/cabinet-exemple.json";
import ludovic from "@/content/propositions/ludovic.json";
import { parsePropositionConfig } from "@/lib/propositions/schema";
import { buildPropositionSteps, stepRequiresValidation } from "@/lib/propositions/steps";

describe("buildPropositionSteps", () => {
  const cabinetConfig = parsePropositionConfig(cabinetExemple);
  const ludovicConfig = parsePropositionConfig(ludovic);

  it("orders recap, proposal blocks, roi, pricing, then payment", () => {
    const steps = buildPropositionSteps(cabinetConfig);

    expect(steps[0]?.kind).toBe("recap");
    expect(steps[cabinetConfig.recap.length - 1]?.kind).toBe("recap");
    expect(steps[cabinetConfig.recap.length]?.kind).toBe("proposal-block");
    expect(steps.at(-2)?.kind).toBe("pricing");
    expect(steps.at(-1)?.kind).toBe("payment");
  });

  it("requires validation on all steps except payment", () => {
    const steps = buildPropositionSteps(cabinetConfig);

    for (const step of steps) {
      if (step.kind === "payment") {
        expect(stepRequiresValidation(step)).toBe(false);
      } else {
        expect(stepRequiresValidation(step)).toBe(true);
      }
    }
  });

  it("parses ludovic config with roi sliders and pricing options", () => {
    expect(ludovicConfig.proposal.roi.sliders?.prospectsDefault).toBe(15);
    expect(ludovicConfig.proposal.pricing.options).toHaveLength(2);
    expect(buildPropositionSteps(ludovicConfig).length).toBeGreaterThan(8);
  });
});
