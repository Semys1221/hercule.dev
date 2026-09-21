"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { DashboardData } from "@/lib/legacy/dashboard/types";

type Props = {
  saasKpi: NonNullable<DashboardData["saasKpi"]>;
};

export function SaasRdvProgressCard({ saasKpi }: Props) {
  if (!saasKpi.hasSlot) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Objectif mensuel</CardTitle>
          <Badge variant="outline">{saasKpi.capacityStatus ?? saasKpi.phase}</Badge>
        </div>
        <CardDescription>
          {saasKpi.inboxAllocation} inbox · {saasKpi.sendsThisMonth.toLocaleString("fr-FR")} /{" "}
          {saasKpi.monthlySendBudget.toLocaleString("fr-FR")} envois ce mois
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-3xl font-semibold tabular-nums">
          {saasKpi.rdvBookedThisMonth}
          <span className="text-lg text-muted-foreground">
            {" "}
            / {saasKpi.rdvGoalMonthly} RDV
          </span>
        </p>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${saasKpi.progressPct}%` }}
          />
        </div>
        {saasKpi.phase !== "active" && saasKpi.estimatedActivationAt ? (
          <p className="text-xs text-muted-foreground">
            Activation estimée :{" "}
            {new Date(saasKpi.estimatedActivationAt).toLocaleDateString("fr-FR")}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
