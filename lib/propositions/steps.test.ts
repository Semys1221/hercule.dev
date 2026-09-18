import { describe, expect, it } from "vitest";

import cabinetB2b from "@/content/propositions/cabinet-b2b.json";
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
    expect(ludovicConfig.proposal.roi.sliders?.prospectsMax).toBe(45);
    expect(ludovicConfig.proposal.pricing.options).toHaveLength(2);
    expect(ludovicConfig.proposal.pricing.options?.find((o) => o.id === "formule-croissance-45")).toBeDefined();
    expect(buildPropositionSteps(ludovicConfig).length).toBeGreaterThan(8);
  });

  it("parses cabinet-exemple config with roi sliders and pricing options", () => {
    expect(cabinetConfig.pageTitle).toBe("Votre proposition R2I");
    expect(cabinetConfig.proposal.roi.sliders?.prospectsDefault).toBe(10);
    expect(cabinetConfig.proposal.roi.sliders?.prospectsMax).toBe(20);
    expect(cabinetConfig.proposal.pricing.options).toHaveLength(2);
    expect(cabinetConfig.proposal.pricing.options?.find((o) => o.id === "formule-test-10")).toBeDefined();
    expect(cabinetConfig.proposal.pricing.options?.find((o) => o.id === "formule-croissance-20")).toBeDefined();
  });

  it("parses cabinet-b2b config as generic proposition with volumes 15/30", () => {
    const cabinetB2bConfig = parsePropositionConfig(cabinetB2b);
    expect(cabinetB2bConfig.slug).toBe("cabinet-b2b");
    expect(cabinetB2bConfig.pageTitle).toBe("Votre proposition Hercule");
    expect(cabinetB2bConfig.proposal.roi.sliders?.prospectsDefault).toBe(15);
    expect(cabinetB2bConfig.proposal.roi.sliders?.prospectsMax).toBe(30);
    expect(cabinetB2bConfig.proposal.pricing.options).toHaveLength(2);
    expect(cabinetB2bConfig.proposal.pricing.options?.find((o) => o.id === "formule-test-15")).toBeDefined();
    expect(cabinetB2bConfig.proposal.pricing.options?.find((o) => o.id === "formule-croissance-30")).toBeDefined();
    const pilier3 = cabinetB2bConfig.proposal.blocks.find((b) => b.id === "pilier-montee");
    expect(pilier3?.visualProspects).toBe(15);
    expect(pilier3?.visualPalier2).toBe(30);
    expect(buildPropositionSteps(cabinetB2bConfig).length).toBeGreaterThan(8);
  });
});
