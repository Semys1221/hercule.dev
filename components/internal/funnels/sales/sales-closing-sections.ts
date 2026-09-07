import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardCheck,
  FileText,
  Link2,
  ShieldCheck,
} from "lucide-react";

import type { SalesFunnelSectionId } from "./sales-funnel-sections";

export type SalesClosingSectionId =
  | "recap"
  | "regles-traitement"
  | "demandes-eligibles"
  | "calendrier"
  | "envoi-dashboard";

export type SalesClosingSection = {
  id: SalesClosingSectionId;
  label: string;
  title: string;
  subtitle?: string;
};

export const SALES_CLOSING_SECTIONS: SalesClosingSection[] = [
  {
    id: "recap",
    label: "Récapitulatif",
    title: "Votre récapitulatif",
    subtitle: "Synthèse des réponses de qualification avant le closing.",
  },
  {
    id: "regles-traitement",
    label: "Règles de traitement",
    title: "Vos règles de traitement",
    subtitle: "Confirmez que vous acceptez nos règles de traitement des demandes.",
  },
  {
    id: "demandes-eligibles",
    label: "Opportunités éligibles",
    title: "Vos opportunités éligibles",
    subtitle: "Profils sélectionnés selon votre questionnaire de qualification.",
  },
  {
    id: "calendrier",
    label: "Calendrier de collaboration",
    title: "Votre calendrier",
    subtitle: "Capacité et créneaux — confirmez votre disponibilité opérationnelle.",
  },
  {
    id: "envoi-dashboard",
    label: "Lien dashboard",
    title: "Accès dashboard",
    subtitle: "Copiez et envoyez le lien de suivi dashboard au prospect.",
  },
];

export const SALES_CLOSING_SECTION_ICONS: Record<SalesClosingSectionId, LucideIcon> = {
  recap: FileText,
  "regles-traitement": ShieldCheck,
  "demandes-eligibles": ClipboardCheck,
  calendrier: Calendar,
  "envoi-dashboard": Link2,
};

export type SalesClosingValues = {
  reglesAccepted: boolean;
  calendrierAccepted: boolean;
};

export const salesClosingDefaultValues: SalesClosingValues = {
  reglesAccepted: false,
  calendrierAccepted: false,
};

export function getSalesClosingSection(
  id: SalesClosingSectionId,
): SalesClosingSection | undefined {
  return SALES_CLOSING_SECTIONS.find((section) => section.id === id);
}

const CLOSING_SECTION_IDS = new Set<SalesClosingSectionId>(
  SALES_CLOSING_SECTIONS.map((section) => section.id),
);

export function isSalesClosingSectionId(
  id: SalesFunnelSectionId | SalesClosingSectionId,
): id is SalesClosingSectionId {
  return CLOSING_SECTION_IDS.has(id as SalesClosingSectionId);
}

export type SalesClosingCompletionContext = {
  values: SalesClosingValues;
  visitedIds: ReadonlySet<SalesClosingSectionId>;
  activeClosingId: SalesClosingSectionId;
};

export function isSalesClosingSectionValidated(
  sectionId: SalesClosingSectionId,
  context: SalesClosingCompletionContext,
): boolean {
  const { values, visitedIds } = context;

  if (sectionId === "recap") {
    return visitedIds.has("recap");
  }
  if (sectionId === "regles-traitement") {
    return values.reglesAccepted;
  }
  if (sectionId === "demandes-eligibles") {
    return visitedIds.has("demandes-eligibles");
  }
  if (sectionId === "calendrier") {
    return values.calendrierAccepted;
  }
  return false;
}

export function isSalesClosingSectionComplete(
  sectionId: SalesClosingSectionId,
  context: SalesClosingCompletionContext,
): boolean {
  if (sectionId === "envoi-dashboard") {
    return false;
  }

  const sectionIndex = SALES_CLOSING_SECTIONS.findIndex((section) => section.id === sectionId);
  if (sectionIndex === -1) {
    return false;
  }

  const priorSections = SALES_CLOSING_SECTIONS.slice(0, sectionIndex);
  const allPriorValidated = priorSections.every((section) =>
    isSalesClosingSectionValidated(section.id, context),
  );

  if (!allPriorValidated) {
    return false;
  }

  return isSalesClosingSectionValidated(sectionId, context);
}

export function isSalesClosingReadyForDashboardLink(values: SalesClosingValues): boolean {
  return values.reglesAccepted && values.calendrierAccepted;
}
