import { ComponentsPageShell } from "@/components/legacy/internal/architecture/components-page-shell";
import { InternalPageHeader } from "@/components/legacy/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/legacy/internal/ui/internal-page-shell";
import {
  COMPONENTS_CAPTION,
  COMPONENTS_LABEL,
  INTERNAL_HOME_LABEL,
} from "@/lib/legacy/admin/funnels/ui-copy";
import { internalHomeHref } from "@/lib/legacy/admin/navigation";

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
