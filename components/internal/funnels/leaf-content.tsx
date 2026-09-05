import { FicheForm } from "@/components/internal/funnels/fiche-form";
import { FunnelLegalDoc } from "@/components/internal/funnels/legal-doc";
import { MockupEditor } from "@/components/internal/funnels/mockup-editor";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { getLegalMarkdownForLeaf } from "@/lib/admin/legal-preview";
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

type FunnelLeafContentProps = {
  audience: Audience;
  leafKey: string;
};

export function FunnelLeafContent({ audience, leafKey }: FunnelLeafContentProps) {
  if (leafKey === "dashboard") {
    return (
      <FunnelPlaceholder
        title="Dashboard KPIs"
        detail={`KPIs funnel à venir — conversion discovery → closing → booked (${audience}).`}
      />
    );
  }

  if (leafKey === "sales_funnel_discovery") {
    return (
      <FunnelPlaceholder
        title="Sales — Discovery"
        detail={`Contenu à venir pour l'étape discovery (${audience}).`}
      />
    );
  }

  if (leafKey === "sales_funnel_pitch") {
    return (
      <FunnelPlaceholder
        title="Sales — Pitch"
        detail={`Contenu à venir pour l'étape pitch (${audience}).`}
      />
    );
  }

  if (leafKey === "sales_funnel_closing") {
    return (
      <FunnelPlaceholder
        title="Sales — Closing"
        detail={`Contenu à venir pour l'étape closing (${audience}).`}
      />
    );
  }

  if (leafKey === "sales_mockup") {
    return <MockupEditor audience={audience} />;
  }

  if (leafKey === "onboarding_funnel") {
    return (
      <FunnelPlaceholder
        title="Onboarding funnel"
        detail={`Parcours onboarding ${audience} — contenu à venir.`}
      />
    );
  }

  if (leafKey === "onboarding_fiche_form") {
    return <FicheForm audience={audience} />;
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
      <FunnelPlaceholder
        title={title}
        detail={`Shell ${audience}. Outil associé : \`${toolHint}\`.`}
      />
    );
  }

  return <FunnelPlaceholder title="Section introuvable" detail={`Renderer inconnu : ${leafKey}`} />;
}
