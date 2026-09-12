import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileText,
  Link2,
  ShieldCheck,
} from "lucide-react";

import type { Audience } from "@/lib/admin/navigation";
import { isCabinetBuyerSalesAudience, isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import {
  interpolateClientSegment,
  type ClientSegment,
} from "@/lib/admin/funnels/client-segment";

import type { SalesFunnelSectionId } from "./sales-funnel-sections";

export type SalesClosingSectionId =
  | "recap"
  | "regles-traitement"
  | "demandes-eligibles"
  | "calendrier"
  | "activation"
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

const COMPTABLE_SALES_CLOSING_SECTIONS: SalesClosingSection[] = [
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
    subtitle:
      "Confirmez que vous acceptez nos règles de traitement des missions {clientSegment}.",
  },
  {
    id: "demandes-eligibles",
    label: "Missions éligibles",
    title: "Vos missions {clientSegment} éligibles",
    subtitle: "Profils sélectionnés selon votre questionnaire de qualification cabinet.",
  },
  {
    id: "calendrier",
    label: "Calendrier de collaboration",
    title: "Votre calendrier",
    subtitle:
      "Capacité et créneaux — confirmez votre disponibilité pour les RDV dirigeants {clientSegment}.",
  },
  {
    id: "envoi-dashboard",
    label: "Lien dashboard",
    title: "Accès dashboard",
    subtitle: "Copiez et envoyez le lien de suivi dashboard au cabinet.",
  },
];

const CIF_SALES_CLOSING_SECTIONS: SalesClosingSection[] = [
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
    subtitle:
      "Confirmez que vous acceptez nos règles de traitement des mandats {clientSegment}.",
  },
  {
    id: "demandes-eligibles",
    label: "Mandats éligibles",
    title: "Vos mandats {clientSegment} éligibles",
    subtitle: "Profils sélectionnés selon votre questionnaire de qualification cabinet.",
  },
  {
    id: "calendrier",
    label: "Calendrier de collaboration",
    title: "Votre calendrier",
    subtitle:
      "Capacité et créneaux — confirmez votre disponibilité pour les RDV dirigeants {clientSegment}.",
  },
  {
    id: "envoi-dashboard",
    label: "Lien dashboard",
    title: "Accès dashboard",
    subtitle: "Copiez et envoyez le lien de suivi dashboard au cabinet.",
  },
];

export function getSalesClosingSections(
  audience: Audience = "agence",
  clientSegment?: ClientSegment,
): SalesClosingSection[] {
  const sections = isCifSalesAudience(audience)
    ? CIF_SALES_CLOSING_SECTIONS
    : isCabinetBuyerSalesAudience(audience)
      ? COMPTABLE_SALES_CLOSING_SECTIONS
      : SALES_CLOSING_SECTIONS;

  if (!isCabinetBuyerSalesAudience(audience) || !clientSegment) {
    return sections;
  }

  return sections.map((section) => ({
    ...section,
    label: interpolateClientSegment(section.label, clientSegment),
    title: interpolateClientSegment(section.title, clientSegment),
    subtitle: section.subtitle
      ? interpolateClientSegment(section.subtitle, clientSegment)
      : undefined,
  }));
}

export const SALES_CLOSING_SECTION_ICONS: Record<SalesClosingSectionId, LucideIcon> = {
  recap: FileText,
  "regles-traitement": ShieldCheck,
  "demandes-eligibles": ClipboardCheck,
  calendrier: Calendar,
  activation: CreditCard,
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
  audience: Audience = "agence",
  clientSegment?: ClientSegment,
): SalesClosingSection | undefined {
  return getSalesClosingSections(audience, clientSegment).find((section) => section.id === id);
}

const CLOSING_SECTION_IDS = new Set<SalesClosingSectionId>([
  ...SALES_CLOSING_SECTIONS.map((section) => section.id),
  "activation",
]);

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
  if (sectionId === "activation") {
    return visitedIds.has("activation");
  }
  return false;
}

export function isSalesClosingSectionComplete(
  sectionId: SalesClosingSectionId,
  context: SalesClosingCompletionContext,
  audience: Audience = "agence",
): boolean {
  if (sectionId === "envoi-dashboard") {
    return false;
  }

  const sections = getSalesClosingSections(audience);
  const sectionIndex = sections.findIndex((section) => section.id === sectionId);
  if (sectionIndex === -1) {
    return false;
  }

  const priorSections = sections.slice(0, sectionIndex);
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
