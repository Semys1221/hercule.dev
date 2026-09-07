import {
  Building2,
  Cpu,
  Gem,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { BudgetKind } from "@/lib/admin/funnels/opportunity-card-formulas";
import type { AgencyPresetId } from "@/lib/admin/funnels/sales-preset-scoring";

export type PresetOpportunityCard = {
  id: string;
  secteur: string;
  zone: string;
  prestation: string;
  budget: string;
  budgetCents: number;
  budgetKind: BudgetKind;
  taille: string;
  dureeSouhaitee: string;
  horizonResultat: string;
  historiqueAgences: string;
  companyNameBlurred: string;
  domainBlurred: string;
  contactEmail: string;
  contactPhone: string;
  minDaysOffset: number;
  maxDaysOffset: number;
};

export type AgencyPreset = {
  id: AgencyPresetId;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
};

export const AGENCY_PRESETS: Record<AgencyPresetId, AgencyPreset> = {
  serial: {
    id: "serial",
    name: "Serial",
    tagline: "Volume élevé, livraison standardisée, tickets accessibles.",
    description:
      "Votre agence dispose d'une forte capacité de livraison, avec des processus documentés et un volume de projets élevé. Les opportunités les plus adaptées sont des mandats PME récurrents, à budget cadré et démarrage rapide.",
    icon: Layers,
  },
  growth: {
    id: "growth",
    name: "Growth",
    tagline: "Acquisition payante et organique, contrats récurrents.",
    description:
      "Votre agence est une agence d'acquisition. Paid Ads, SEO et récurrence forment votre cœur de métier. Les opportunités ciblées sont des budgets mensuels stables, avec un besoin de performance mesurable.",
    icon: TrendingUp,
  },
  architect: {
    id: "architect",
    name: "Architect",
    tagline: "Développement, no-code et intégrations techniques.",
    description:
      "Votre agence est technique. Front, back, Shopify ou automatisation : vous livrez des systèmes, pas seulement des pages. Les opportunités ciblées demandent un interlocuteur capable de concevoir et d'intégrer.",
    icon: Cpu,
  },
  specialist: {
    id: "specialist",
    name: "Specialist",
    tagline: "Expertise étroite, projets complexes, tickets premium.",
    description:
      "Votre agence est spécialisée. Peu de verticales, un haut niveau d'exigence, des tickets plus élevés. Les opportunités ciblées sont des dossiers à forte composante métier, trop spécifiques pour une agence généraliste.",
    icon: Building2,
  },
  premium: {
    id: "premium",
    name: "Premium",
    tagline: "Faible volume, haute valeur, grandes structures.",
    description:
      "Votre agence est à faible volume et tickets élevés. Vous sélectionnez vos mandats. Les opportunités ciblées sont des ETI / grandes entreprises, avec un besoin stratégique et un budget à la hauteur.",
    icon: Gem,
  },
};

export function getAgencyPreset(id: AgencyPresetId): AgencyPreset {
  return AGENCY_PRESETS[id];
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
});

export function formatContractWindow(
  card: Pick<PresetOpportunityCard, "minDaysOffset" | "maxDaysOffset">,
  from: Date = new Date(),
): string {
  const min = new Date(from);
  min.setDate(min.getDate() + card.minDaysOffset);
  const max = new Date(from);
  max.setDate(max.getDate() + card.maxDaysOffset);
  return `Prêt pour contrat entre ${dateFormatter.format(min)} et ${dateFormatter.format(max)}`;
}
