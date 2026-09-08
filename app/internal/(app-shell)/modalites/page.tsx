import { ModalitesCampaignShell } from "@/components/internal/modalites/modalites-campaign-shell";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";

export default function InternalModalitesPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <InternalPageHeader
        title="Modalités Hercule"
        description="Campagne temporaire : confirmer les RDV pending (agences et cabinets). Rappel H-3, annulation Calendly H-1."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "Modalités" },
        ]}
      />
      <ModalitesCampaignShell />
    </main>
  );
}
