import type { SalesSingleQuestion } from "../sales-questions";

export function pitchSingleQuestion(
  id: string,
  prompt: string,
  options: SalesSingleQuestion["options"],
): SalesSingleQuestion {
  return { id, number: 0, prompt, sectionId: "pitch", type: "single", options };
}
