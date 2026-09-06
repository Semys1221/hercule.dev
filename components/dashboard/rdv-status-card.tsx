"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData } from "@/lib/dashboard/types";

function formatScheduledAt(value: string): string {
  return new Date(value).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type RdvStatusCardProps = {
  data: DashboardData;
};

export function RdvStatusCard({ data }: RdvStatusCardProps) {
  const hasScheduledRdv = Boolean(data.scheduledAt);

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Vos rendez-vous</CardTitle>
        <CardDescription>
          Allocation standard — 30 inboxes actives.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary text-foreground">
            3–4 RDV honorés / mois
          </Badge>
          <span className="text-sm text-muted-foreground">Objectif SLA</span>
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">Prochain RDV</p>
          {hasScheduledRdv ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {formatScheduledAt(data.scheduledAt!)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">En recherche active</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
