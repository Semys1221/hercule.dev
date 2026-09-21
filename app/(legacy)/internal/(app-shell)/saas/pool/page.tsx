import { SaasPoolShell } from "@/components/legacy/internal/saas/saas-pool-shell";
import { InternalPageHeader } from "@/components/legacy/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/legacy/internal/ui/internal-page-shell";
import { ADMIN_ROOT_LABEL } from "@/lib/legacy/admin/funnels/ui-copy";

export default function SaasPoolPage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title="SaaS — Pool prospects"
        description="Stock evergreen restaurant / santé / BTP — alertes sous-seuil."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "SaaS", href: "/internal/saas/clients" },
          { label: "Pool" },
        ]}
      />
      <SaasPoolShell />
    </InternalPageShell>
  );
}
