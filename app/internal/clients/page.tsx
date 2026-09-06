import { ClientsTable } from "@/components/internal/clients/clients-table";

export default function ClientsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">Clients</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Agences et entreprises ayant complété leur onboarding.
        </p>
      </div>

      <ClientsTable />
    </div>
  );
}
