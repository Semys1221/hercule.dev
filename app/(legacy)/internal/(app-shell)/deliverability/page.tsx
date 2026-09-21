import { DeliverabilityShell } from "@/components/legacy/internal/deliverability/deliverability-shell";
import { InternalPageHeader } from "@/components/legacy/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/legacy/internal/ui/internal-page-shell";
import {
  ADMIN_ROOT_LABEL,
} from "@/lib/legacy/admin/funnels/ui-copy";

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
