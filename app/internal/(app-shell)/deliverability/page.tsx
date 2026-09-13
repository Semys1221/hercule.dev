import { DeliverabilityShell } from "@/components/internal/deliverability/deliverability-shell";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import {
  ADMIN_ROOT_LABEL,
} from "@/lib/admin/funnels/ui-copy";

export default function InternalDeliverabilityPage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title="Deliverability"
        description="Santé des inboxes Instantly — placement warmup, DNS (SPF/DKIM/DMARC) et panneau de contrôle ops."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "Deliverability" },
        ]}
      />
      <DeliverabilityShell />
    </InternalPageShell>
  );
}
