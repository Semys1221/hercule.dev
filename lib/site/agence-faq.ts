import type { FaqEntry } from "@/lib/site/faq-types";
import { getFaqEntries } from "@/lib/site/faq-data";

/** @deprecated Use `FaqEntry` from `@/lib/site/faq-types` */
export type AgenceFaqEntry = Omit<FaqEntry, "id">;

/** @deprecated Use `getFaqEntries("agence")` from `@/lib/site/faq` */
export const AGENCE_FAQ: AgenceFaqEntry[] = getFaqEntries("agence").map(
  ({ question, answer, cvgLink }) => ({ question, answer, cvgLink }),
);
