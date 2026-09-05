import { notFound } from "next/navigation";

import { Suspense } from "react";

import {
  FunnelBuilderList,
  FunnelEditor,
} from "@/components/internal/funnels/builder/funnel-editor";
import { FicheForm } from "@/components/internal/funnels/fiche-form";
import { FaqEditor } from "@/components/internal/funnels/faq-editor";
import { FunnelLegalDoc } from "@/components/internal/funnels/legal-doc";
import { PricingEditor } from "@/components/internal/funnels/pricing-editor";
import { MockupEditor } from "@/components/internal/funnels/mockup-editor";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { InternalLeafToolbar } from "@/components/internal/funnels/ui/internal-leaf-toolbar";
import { getLegalMarkdownForLeaf } from "@/lib/admin/legal-preview";
import { scopeForParsedLeaf } from "@/lib/admin/funnels/routing";
import { FUNNEL_LIST_LEAF_KEYS } from "@/lib/admin/funnels/schema";
import type { Audience } from "@/lib/admin/navigation";

const EMAIL_TOOL_HINTS: Record<string, string> = {
  emails_pre_close_outreach: "npm run streamlit-scraper",
  emails_pre_close_subsequence: "npm run streamlit-subsequence",
  emails_pre_close_reply_prompt: "npm run streamlit-reply-agent",
  emails_pre_close_booking: "npm run streamlit-booking-resend",
  emails_close_onboarding: "booking-communication / séquences post-signature (à venir)",
  emails_close_notifications: "matching / post-RDV notifications (à venir)",
};

const EMAIL_TITLES: Record<string, string> = {
  emails_pre_close_outreach: "Emails — PRE-CLOSE — Outreach",
  emails_pre_close_subsequence: "Emails — PRE-CLOSE — Subsequence",
  emails_pre_close_reply_prompt: "Emails — PRE-CLOSE — Reply prompt",
  emails_pre_close_booking: "Emails — PRE-CLOSE — Booking",
  emails_close_onboarding: "Emails — CLOSE — Onboarding",
  emails_close_notifications: "Emails — CLOSE — Notifications",
};

const FUNNEL_TITLES: Record<string, string> = {
  sales_funnel_discovery: "Sales — Discovery",
  sales_funnel_pitch: "Sales — Pitch",
  sales_funnel_closing: "Sales — Closing",
  onboarding_funnel: "Onboarding funnel",
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

  if (leafKey === "dashboard") {
    return (
      <>
        <InternalLeafToolbar leafKey={leafKey} />
        <FunnelPlaceholder
          title="Dashboard KPIs"
          detail={`KPIs funnel à venir — conversion discovery → closing → booked (${audience}).`}
        />
      </>
    );
  }

  if (leafKey === "sales_mockup") {
    return <MockupEditor audience={audience} />;
  }

  if (leafKey === "onboarding_fiche_form") {
    return <FicheForm audience={audience} />;
  }

  if (leafKey === "legal_faq") {
    return <FaqEditor audience={audience} />;
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

  if (leafKey.startsWith("emails_")) {
    const title = EMAIL_TITLES[leafKey] ?? leafKey;
    const toolHint = EMAIL_TOOL_HINTS[leafKey] ?? "à venir";
    return (
      <>
        <InternalLeafToolbar leafKey={leafKey} />
        <FunnelPlaceholder
          title={title}
          detail={`Shell ${audience}. Outil associé : \`${toolHint}\`.`}
        />
      </>
    );
  }

  return <FunnelPlaceholder title="Section introuvable" detail={`Renderer inconnu : ${leafKey}`} />;
}
