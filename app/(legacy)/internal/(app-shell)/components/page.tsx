import { ComponentsPageShell } from "@/components/legacy/internal/architecture/components-page-shell";
import { InternalPageHeader } from "@/components/legacy/internal/funnels/ui/internal-page-header";
import { ADMIN_ROOT_LABEL } from "@/lib/legacy/admin/funnels/ui-copy";

export default function InternalComponentsPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <InternalPageHeader
        title="Inventaire composants"
        description="Cartographie recipient / trigger / edition + orchestrateurs (webhooks, crons, API)."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "Composants" },
        ]}
      />
      <ComponentsPageShell />
    </main>
  );
}
