import {
  engagementLabel,
  type PipelineQualificationInput,
} from "@/lib/calendly/pipeline-qualification-schema";

export function buildPipelineIntroScript(
  input: Pick<PipelineQualificationInput, "company_name" | "engagement">,
): string {
  const label = engagementLabel(input.engagement);
  return [
    "Vous êtes la gestionnaire de plusieurs sociétés, cela comprend hercule.dev qui est la partie développeur",
    `et ${input.company_name} qui est la partie marketing stratégie.`,
    `Vous avez rempli que vous cherchez une « ${label} » — c'est bien ça ?`,
    "Qu'est-ce que vous recherchez exactement ?",
  ].join(" ");
}
