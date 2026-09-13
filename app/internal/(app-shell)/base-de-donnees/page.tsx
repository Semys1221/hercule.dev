import { DatabaseTable } from "@/components/internal/architecture/database-table";
import { InternalPageHeader } from "@/components/internal/ui/internal-page-header";
import { InternalPageShell } from "@/components/internal/ui/internal-page-shell";
import {
  DATABASE_CAPTION,
  DATABASE_LABEL,
  INTERNAL_HOME_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import { internalHomeHref } from "@/lib/admin/navigation";

export default function InternalDatabasePage() {
  return (
    <InternalPageShell>
      <InternalPageHeader
        title={DATABASE_LABEL}
        description={DATABASE_CAPTION}
        segments={[
          { label: INTERNAL_HOME_LABEL, href: internalHomeHref() },
          { label: DATABASE_LABEL },
        ]}
      />
      <DatabaseTable />
    </InternalPageShell>
  );
}
