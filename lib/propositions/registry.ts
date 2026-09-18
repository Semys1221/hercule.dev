import cabinetExemple from "@/content/propositions/cabinet-exemple.json";
import ludovic from "@/content/propositions/ludovic.json";
import {
  parsePropositionConfig,
  type PropositionConfig,
} from "@/lib/propositions/schema";

const RAW_PROPOSITIONS = [cabinetExemple, ludovic] as const;

const PROPOSITIONS: PropositionConfig[] = RAW_PROPOSITIONS.map((raw) =>
  parsePropositionConfig(raw),
);

export type PropositionListItem = {
  slug: string;
  label: string;
  tenant: PropositionConfig["tenant"];
};

export function listPropositions(): PropositionListItem[] {
  return PROPOSITIONS.map((config) => ({
    slug: config.slug,
    label: config.label,
    tenant: config.tenant,
  }));
}

export function getProposition(slug: string): PropositionConfig | null {
  return PROPOSITIONS.find((config) => config.slug === slug) ?? null;
}

export function getAllPropositions(): PropositionConfig[] {
  return PROPOSITIONS;
}
