"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DASHBOARD_STARTER_SUBTITLE, formatStarterProgress } from "@/lib/dashboard/copy";
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
  const deliveryPlan = data.deliveryPlan;

  if (!deliveryPlan) {
    return null;
  }

  const progressLabel = formatStarterProgress(
    deliveryPlan.attributionsUsed,
    deliveryPlan.attributionsTotal,
  );

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Vos rendez-vous</CardTitle>
        <CardDescription>{DASHBOARD_STARTER_SUBTITLE}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-primary text-foreground">
            {progressLabel}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {deliveryPlan.formulaLabel}
          </span>
        </div>

        <div>
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
