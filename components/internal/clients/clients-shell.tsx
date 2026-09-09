"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Niche } from "@/lib/admin/navigation";

import { ClientsSequencesTab } from "./clients-sequences-tab";
import { ClientsTable } from "./clients-table";

type ClientsShellProps = {
  niche: Niche;
};

export function ClientsShell({ niche }: ClientsShellProps) {
  return (
    <Tabs defaultValue="pipeline" className="flex flex-col gap-4">
      <TabsList>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="sequences">Séquences</TabsTrigger>
      </TabsList>
      <TabsContent value="pipeline" className="mt-0">
        <ClientsTable niche={niche} />
      </TabsContent>
      <TabsContent value="sequences" className="mt-0">
        <ClientsSequencesTab niche={niche} />
      </TabsContent>
    </Tabs>
  );
}
