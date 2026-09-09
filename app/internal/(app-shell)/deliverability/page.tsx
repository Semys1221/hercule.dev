import { DeliverabilityShell } from "@/components/internal/deliverability/deliverability-shell";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";

export default function InternalDeliverabilityPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <InternalPageHeader
        title="Deliverability"
        description="Santé des inboxes Instantly — placement warmup, DNS (SPF/DKIM/DMARC) et panneau de contrôle ops."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "Deliverability" },
        ]}
      />
      <DeliverabilityShell />
    </main>
  );
}
