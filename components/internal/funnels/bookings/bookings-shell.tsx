"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Niche } from "@/lib/admin/navigation";

import { BookingsTable } from "./bookings-table";
import { BookingsDbTab } from "./bookings-db-tab";
import { BookingsSequencesTab } from "./bookings-sequences-tab";
import { NicheSwitcher } from "@/components/internal/funnels/niche-switcher";

type BookingsShellProps = {
  niche: Niche;
};

export function BookingsShell({ niche }: BookingsShellProps) {
  return (
    <div className="flex flex-col gap-4">
      <NicheSwitcher />
      <Tabs defaultValue="pipeline" className="flex flex-col gap-4">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="sequences">Séquences</TabsTrigger>
          <TabsTrigger value="db">DB</TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="mt-0">
          <BookingsTable niche={niche} />
        </TabsContent>
        <TabsContent value="sequences" className="mt-0">
          <BookingsSequencesTab niche={niche} />
        </TabsContent>
        <TabsContent value="db" className="mt-0">
          <BookingsDbTab niche={niche} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
