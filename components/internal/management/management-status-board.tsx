"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RECIPIENT_STATUS_LABELS,
  statusBadgeVariant,
} from "@/lib/admin/management/recipients/status-labels";
import type { RecipientStatus, RecipientStatusCounts } from "@/lib/admin/management/recipients/types";
import { cn } from "@/lib/utils";

const STATUS_ORDER: RecipientStatus[] = [
  "scheduled",
  "active",
  "paused",
  "completed",
  "stopped",
  "failed",
];

type ManagementStatusBoardProps = {
  counts: RecipientStatusCounts;
  activeStatus?: RecipientStatus | null;
  onStatusClick?: (status: RecipientStatus | null) => void;
};

export function ManagementStatusBoard({
  counts,
  activeStatus,
  onStatusClick,
}: ManagementStatusBoardProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {STATUS_ORDER.map((status) => {
        const selected = activeStatus === status;
        return (
          <Card
            key={status}
            className={cn(
              "cursor-pointer transition-colors hover:border-primary/40",
              selected && "border-primary ring-1 ring-primary/30",
            )}
            onClick={() => onStatusClick?.(selected ? null : status)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {RECIPIENT_STATUS_LABELS[status]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  statusBadgeVariant(status) === "destructive" && counts[status] > 0
                    ? "text-destructive"
                    : "text-foreground",
                )}
              >
                {counts[status]}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
