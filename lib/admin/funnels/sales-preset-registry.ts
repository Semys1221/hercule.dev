import {
  Building2,
  Cpu,
  Gem,
  Layers,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { Audience } from "@/lib/admin/navigation";
import { isCabinetBuyerSalesAudience, isCifSalesAudience, isComptableSalesAudience } from "@/lib/admin/funnels/sales-audience";

import type { BudgetKind } from "@/lib/admin/funnels/opportunity-card-formulas";
import type { AgencyPresetId } from "@/lib/admin/funnels/sales-preset-scoring";

export type PresetOpportunityCard = {
  id: string;
  secteur: string;
  zone: string;
  origine?: string;
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

const COMPTABLE_AGENCY_PRESETS: Record<AgencyPresetId, AgencyPreset> = {
  serial: {
    ...AGENCY_PRESETS.serial,
    tagline: "Volume élevé, processus documentés, honoraires accessibles.",
    description:
      "Votre cabinet dispose d'une forte capacité de production, avec des processus documentés et un volume de dossiers TPE élevé. Les missions les plus adaptées sont des reprises de tenue récurrentes, à honoraires cadrés et démarrage rapide.",
  },
  growth: {
    ...AGENCY_PRESETS.growth,
    tagline: "Fiscal et social récurrents, dossiers TPE stables.",
    description:
      "Votre cabinet est orienté missions récurrentes — tenue, fiscal, social. Les demandes ciblées sont des dirigeants TPE avec un besoin de continuité et un horizon de mission clair.",
  },
  architect: {
    ...AGENCY_PRESETS.architect,
    tagline: "Outils digitaux, intégrations et dossiers structurés.",
    description:
      "Votre cabinet est outillé. Portails clients, automatisation ou intégrations : vous structurez la relation dirigeant-cabinet. Les missions ciblées demandent un interlocuteur capable de cadrer un périmètre technique.",
  },
  specialist: {
    ...AGENCY_PRESETS.specialist,
    tagline: "Expertise étroite, dossiers complexes, honoraires premium.",
    description:
      "Votre cabinet est spécialisé. Peu de verticales, un haut niveau d'exigence, des honoraires plus élevés. Les missions ciblées sont des dossiers à forte composante réglementaire ou sectorielle.",
  },
  premium: {
    ...AGENCY_PRESETS.premium,
    tagline: "Faible volume, haute valeur, structures exigeantes.",
    description:
      "Votre cabinet est à faible volume et honoraires élevés. Vous sélectionnez vos mandats. Les missions ciblées sont des PME / ETI avec un besoin stratégique et un ticket à la hauteur.",
  },
};

const CIF_AGENCY_PRESETS: Record<AgencyPresetId, AgencyPreset> = {
  serial: {
    ...AGENCY_PRESETS.serial,
    tagline: "Volume élevé, processus documentés, honoraires accessibles.",
    description:
      "Votre cabinet dispose d'une forte capacité de conseil, avec des processus documentés et un volume de mandats élevé. Les missions les plus adaptées sont des mandats patrimoniaux récurrents, à honoraires cadrés et démarrage rapide.",
  },
  growth: {
    ...AGENCY_PRESETS.growth,
    tagline: "Patrimoine et trésorerie récurrents, mandats dirigeants stables.",
    description:
      "Votre cabinet est orienté mandats récurrents — patrimoine, trésorerie, retraite. Les demandes ciblées sont des dirigeants PME avec un besoin de continuité et un horizon de mission clair.",
  },
  architect: {
    ...AGENCY_PRESETS.architect,
    tagline: "Ingénierie patrimoniale, transmission et structuration.",
    description:
      "Votre cabinet est orienté ingénierie. Transmission, crédit, fiscal patrimonial : vous structurez la relation dirigeant-cabinet. Les missions ciblées demandent un interlocuteur capable de cadrer un périmètre complexe.",
  },
  specialist: {
    ...AGENCY_PRESETS.specialist,
    tagline: "Expertise étroite, mandats complexes, honoraires premium.",
    description:
      "Votre cabinet est spécialisé. Peu de verticales, un haut niveau d'exigence, des honoraires plus élevés. Les missions ciblées sont des dossiers à forte composante d'ingénierie ou sectorielle.",
  },
  premium: {
    ...AGENCY_PRESETS.premium,
    tagline: "Faible volume, haute valeur, encours élevés.",
    description:
      "Votre cabinet est à faible volume et honoraires élevés. Vous sélectionnez vos mandats. Les missions ciblées sont des dirigeants PME structurés avec un besoin stratégique et un encours à la hauteur.",
  },
};

export function getAgencyPreset(id: AgencyPresetId, audience: Audience = "agence"): AgencyPreset {
  if (isCifSalesAudience(audience)) {
    return CIF_AGENCY_PRESETS[id];
  }
  if (isComptableSalesAudience(audience)) {
    return COMPTABLE_AGENCY_PRESETS[id];
  }
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
