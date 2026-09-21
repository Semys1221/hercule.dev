import { ClientsShell } from "@/components/legacy/internal/clients/clients-shell";
import { BookingsShell } from "@/components/legacy/internal/funnels/bookings/bookings-shell";
import { FunnelPlaceholder } from "@/components/legacy/internal/funnels/placeholder";
import type { Audience } from "@/lib/legacy/admin/navigation";

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
        detail={`Éditez les fichiers sous app/(marketing)/content/legal-documentation/${audience}/ dans le repo. Les séquences email sont dans Bookings → Séquences.`}
      />
    );
  }

  return <FunnelPlaceholder title="Section introuvable" detail={`Renderer inconnu : ${leafKey}`} />;
}
