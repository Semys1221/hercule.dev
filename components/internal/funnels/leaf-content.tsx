import { ClientsShell } from "@/components/internal/clients/clients-shell";
import { BookingsShell } from "@/components/internal/funnels/bookings/bookings-shell";
import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
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
    return <BookingsShell niche={audience} />;
  }

  if (leafKey === "clients_hub") {
    return <ClientsShell niche={audience} />;
  }

  if (leafKey.startsWith("legal_") || leafKey === "emails_hub") {
    return (
      <FunnelPlaceholder
        title="Contenu déplacé"
        detail={`Éditez les fichiers sous content/legal-documentation/${audience}/ dans le repo. Les séquences email sont dans Bookings → Séquences.`}
      />
    );
  }

  return <FunnelPlaceholder title="Section introuvable" detail={`Renderer inconnu : ${leafKey}`} />;
}
