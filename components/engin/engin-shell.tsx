"use client";

import { HerculeMark } from "@/components/hercule-mark";

import { EnginClientsTable } from "./clients/engin-clients-table";

export function EnginShell() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <HerculeMark className="size-8 text-foreground" />
        <div>
          <p className="text-sm text-muted-foreground">Admin</p>
          <h1 className="text-2xl font-semibold tracking-tight">Engin</h1>
          <p className="text-sm text-muted-foreground">
            Orchestration clients conférence — crédits, onboarding, abonnements.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Clients</h2>
          <p className="text-sm text-muted-foreground">
            Table Supabase <code className="text-xs">public.clients</code>
          </p>
        </div>
        <EnginClientsTable />
      </section>
    </main>
  );
}
