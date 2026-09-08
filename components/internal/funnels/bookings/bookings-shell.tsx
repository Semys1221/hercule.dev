"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Audience } from "@/lib/admin/navigation";

import { BookingsTable } from "./bookings-table";
import { ConfirmSequenceTab } from "./confirm-sequence-tab";

type BookingsShellProps = {
  audience: Audience;
};

export function BookingsShell({ audience }: BookingsShellProps) {
  return (
    <Tabs defaultValue="bookings" className="space-y-4">
      <TabsList>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="confirm-sequence">Confirm sequence</TabsTrigger>
      </TabsList>
      <TabsContent value="bookings" className="mt-0">
        <BookingsTable audience={audience} />
      </TabsContent>
      <TabsContent value="confirm-sequence" className="mt-0">
        <ConfirmSequenceTab />
      </TabsContent>
    </Tabs>
  );
}
