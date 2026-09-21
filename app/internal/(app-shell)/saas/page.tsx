import { SaasRouterShell } from "@/components/internal/saas/saas-router-shell";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";

export default function SaasRouterPage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title="SaaS — Router"
        description="Logs du pool router (fair-share, assignations, erreurs)."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "SaaS", href: "/internal/saas/clients" },
          { label: "Router" },
        ]}
      />
      <SaasRouterShell />
    </InternalPageShell>
  );
}
