"use client";

import { EnginClientsTable } from "./clients/engin-clients-table";

export function EnginShell() {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-medium">Clients</h2>
        <p className="text-sm text-muted-foreground">
          Cliquez une ligne pour ouvrir la fiche. Filtre « À traiter » : un contrôle ops est encore ouvert.
        </p>
      </div>
      <EnginClientsTable />
    </section>
  );
}
