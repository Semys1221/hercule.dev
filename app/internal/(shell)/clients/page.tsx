import { ClientsTable } from "@/components/internal/clients/clients-table";
import { InternalPageHeader } from "@/components/internal/funnels/ui/internal-page-header";

export default function ClientsPage() {
  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10">
      <InternalPageHeader
        title="Clients"
        description="Agences et entreprises produit — cliquer une ligne ouvre le cockpit."
        segments={[
          { label: "Internal", href: "/internal" },
          { label: "Clients" },
        ]}
      />
      <ClientsTable />
    </main>
  );
}
