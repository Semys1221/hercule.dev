import { SaasClientsShell } from "@/components/legacy/internal/saas/saas-clients-shell";
import { InternalPageHeader } from "@/components/legacy/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/legacy/internal/ui/internal-page-shell";
import { ADMIN_ROOT_LABEL } from "@/lib/legacy/admin/funnels/ui-copy";

export default function SaasClientsPage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title="SaaS — Clients"
        description="Slots outreach autonomes — statut capacity, campagnes Instantly, Calendly."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "SaaS", href: "/internal/saas/clients" },
          { label: "Clients" },
        ]}
      />
      <SaasClientsShell />
    </InternalPageShell>
  );
}
