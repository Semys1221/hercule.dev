import { SaasInboxQueueShell } from "@/components/legacy/internal/saas/saas-inbox-queue-shell";
import { InternalPageHeader } from "@/components/legacy/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/legacy/internal/ui/internal-page-shell";
import { ADMIN_ROOT_LABEL } from "@/lib/legacy/admin/funnels/ui-copy";

export default function SaasInboxQueuePage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title="SaaS — File inbox"
        description="Provision semi-auto des 30 inbox Instantly par client (DFY / domaines)."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "SaaS", href: "/internal/saas/clients" },
          { label: "Inbox queue" },
        ]}
      />
      <SaasInboxQueueShell />
    </InternalPageShell>
  );
}
