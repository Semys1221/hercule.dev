import data from "./case-studies.json";

export type FirmCategory = "accounting" | "brokerage";

export type CaseFirm = {
  slug: string;
  name: string;
  category: FirmCategory;
  website: string;
  logo: string;
};

export type FeaturedCase = {
  slug: string;
  /** Leader and headcount are placeholders until checked with the firm. */
  sample?: boolean;
  leader: string;
  headcount: string;
  situation: string;
  action: string;
  resultLine: string;
};

export type BrokerageMetrics = {
  days: number;
  profiles: number;
  conversionPct: number;
  avgBasketEur: number;
};

export type AccountingMetrics = {
  monthProfiles: [number, number, number];
  conversionPct: number;
  ticketMinEur: number;
  ticketMaxEur: number;
  cumulativeRevenueEur: number;
};

type CaseStudiesFile = {
  featured: {
    brokerage: FeaturedCase;
    accounting: FeaturedCase;
  };
  metrics: {
    brokerage: BrokerageMetrics;
    accounting: AccountingMetrics;
  };
  firms: CaseFirm[];
};

const file = data as CaseStudiesFile;

export const CASE_STUDIES = file;

/** Case scene beats: identity, situation, action, résultat, then figures. */
export const CASE_STEP_COUNT = 5;
export const CASE_FIGURES_STEP = CASE_STEP_COUNT - 1;

export function firmsByCategory(category: FirmCategory): CaseFirm[] {
  return file.firms.filter((firm) => firm.category === category);
}

export function firmBySlug(slug: string): CaseFirm | undefined {
  if (!slug) return undefined;
  return file.firms.find((firm) => firm.slug === slug);
}

export function formatEur(value: number): string {
  return `${value.toLocaleString("fr-FR")} €`;
}
