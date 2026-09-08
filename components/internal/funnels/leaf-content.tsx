import { ClientsTable } from "@/components/internal/clients/clients-table";
import { BookingsShell } from "@/components/internal/funnels/bookings/bookings-shell";
import { FaqManagementShell } from "@/components/internal/funnels/faq-management-shell";
import { FunnelLegalDoc } from "@/components/internal/funnels/legal-doc";
import { PricingEditor } from "@/components/internal/funnels/pricing-editor";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { getLegalMarkdownForLeaf } from "@/lib/admin/legal-preview";
import type { Audience } from "@/lib/admin/navigation";

type FunnelLeafContentProps = {
  audience: Audience;
  leafKey: string;
};

export function FunnelLeafContent({
  audience,
  leafKey,
}: FunnelLeafContentProps) {
  if (leafKey === "bookings_hub") {
    if (audience !== "agence") {
      return (
        <FunnelPlaceholder
          title="Bookings"
          detail="Disponible pour l'audience agence uniquement."
        />
      );
    }
    return <BookingsShell audience={audience} />;
  }

  if (leafKey === "clients_hub") {
    if (audience !== "agence") {
      return (
        <FunnelPlaceholder
          title="Clients"
          detail="Disponible pour l'audience agence uniquement."
        />
      );
    }
    return <ClientsTable />;
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
    return (
      <FunnelLegalDoc
        audience={audience}
        docType={legal.docType}
        label={legal.label}
      />
    );
  }

  return <FunnelPlaceholder title="Section introuvable" detail={`Renderer inconnu : ${leafKey}`} />;
}
