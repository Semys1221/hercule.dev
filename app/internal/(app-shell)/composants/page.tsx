import { ComponentsPageShell } from "@/components/internal/architecture/components-page-shell";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import {
  COMPONENTS_CAPTION,
  COMPONENTS_LABEL,
  INTERNAL_HOME_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import { internalHomeHref } from "@/lib/admin/navigation";

export default function InternalComponentsPage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title={COMPONENTS_LABEL}
        description={COMPONENTS_CAPTION}
        segments={[
          { label: INTERNAL_HOME_LABEL, href: internalHomeHref() },
          { label: COMPONENTS_LABEL },
        ]}
      />
      <ComponentsPageShell />
    </InternalPageShell>
  );
}
