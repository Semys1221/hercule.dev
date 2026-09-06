import { Suspense } from "react";

import { BookingsTable } from "@/components/internal/funnels/bookings/bookings-table";
import {
  FunnelBuilderList,
  FunnelEditor,
} from "@/components/internal/funnels/builder/funnel-editor";
import { FicheForm } from "@/components/internal/funnels/fiche-form";
import { FaqManagementShell } from "@/components/internal/funnels/faq-management-shell";
import { FunnelLegalDoc } from "@/components/internal/funnels/legal-doc";
import { PricingEditor } from "@/components/internal/funnels/pricing-editor";
import { DashboardStateTable } from "@/components/internal/funnels/dashboard/dashboard-state-table";
import { DeliverancePanel } from "@/components/internal/funnels/deliverance-panel";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { InternalLeafToolbar } from "@/components/internal/funnels/ui/internal-leaf-toolbar";
import { getLegalMarkdownForLeaf } from "@/lib/admin/legal-preview";
import { scopeForParsedLeaf } from "@/lib/admin/funnels/routing";
import { ONBOARDING_PARCOURS_LEAF_TITLE } from "@/lib/admin/funnels/ui-copy";
import { FUNNEL_LIST_LEAF_KEYS } from "@/lib/admin/funnels/schema";
import type { Audience } from "@/lib/admin/navigation";

const FUNNEL_TITLES: Record<string, string> = {
  onboarding_funnel: ONBOARDING_PARCOURS_LEAF_TITLE,
};

type FunnelLeafContentProps = {
  audience: Audience;
  leafKey: string;
  navPath: string[];
  funnelSlug?: string | null;
};

export function FunnelLeafContent({
  audience,
  leafKey,
  navPath,
  funnelSlug,
}: FunnelLeafContentProps) {
  if (FUNNEL_LIST_LEAF_KEYS.has(leafKey)) {
    const scope = scopeForParsedLeaf(audience, leafKey);
    if (!scope) {
      return <FunnelPlaceholder title="Scope introuvable" />;
    }

    const title = FUNNEL_TITLES[leafKey] ?? leafKey;

    if (funnelSlug) {
      return (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Chargement…</p>}>
          <FunnelEditor scope={scope} navPath={navPath} funnelSlug={funnelSlug} />
        </Suspense>
      );
    }

    return <FunnelBuilderList scope={scope} navPath={navPath} title={title} />;
  }

  if (leafKey === "bookings_hub") {
    if (audience !== "agence") {
      return (
        <FunnelPlaceholder
          title="Bookings"
          detail="Disponible pour l'audience agence uniquement."
        />
      );
    }
    return (
      <>
        <InternalLeafToolbar leafKey={leafKey} />
        <BookingsTable audience={audience} />
      </>
    );
  }

  if (leafKey === "dashboard") {
    return (
      <>
        <InternalLeafToolbar leafKey={leafKey} />
        <DashboardStateTable />
      </>
    );
  }

  if (leafKey === "delivery_hub") {
    return (
      <>
        <InternalLeafToolbar leafKey={leafKey} />
        <DeliverancePanel />
      </>
    );
  }

  if (leafKey === "onboarding_fiche_form") {
    return <FicheForm audience={audience} />;
  }

  if (leafKey === "legal_faq") {
    return <FaqManagementShell audience={audience} />;
  }

  if (leafKey === "legal_pricing") {
    return <PricingEditor audience={audience} />;
  }

  if (leafKey.startsWith("legal_")) {
    const legal = getLegalMarkdownForLeaf(audience, leafKey);
    if (!legal) {
      return <FunnelPlaceholder title="Document introuvable" />;
    }
    return <FunnelLegalDoc label={legal.label} markdown={legal.markdown} />;
  }

  return <FunnelPlaceholder title="Section introuvable" detail={`Renderer inconnu : ${leafKey}`} />;
}
