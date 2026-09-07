import { DatabaseTable } from "@/components/internal/architecture/database-table";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";
import { ADMIN_ROOT_LABEL } from "@/lib/admin/funnels/ui-copy";

export default function InternalDatabasePage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <InternalPageHeader
        title="Inventaire base de données"
        description="Tables Supabase — domaine, colonnes clés, acteurs d'écriture/lecture et dépendances."
        segments={[
          { label: ADMIN_ROOT_LABEL, href: "/internal" },
          { label: "Database" },
        ]}
      />
      <DatabaseTable />
    </main>
  );
}
