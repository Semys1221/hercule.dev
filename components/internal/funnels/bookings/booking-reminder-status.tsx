"use client";

import { useMemo, useState } from "react";
import { Mail, X } from "lucide-react";

import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import {
  buildReminderLines,
  reminderMarkerTone,
  reminderStatusLabel,
  sequenceIsLive,
} from "@/lib/admin/bookings/reminder-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { LeadCategory } from "@/lib/link-tracking/types";
import { cn } from "@/lib/utils";

type BookingReminderStatusProps = {
  leadId: string | null;
  scheduledAt: string;
  category: LeadCategory;
  jobs: BookingEmailJobSummary[];
};

function markerDotClass(tone: ReturnType<typeof reminderMarkerTone>): string {
  if (tone === "live") {
    return "bg-emerald-500";
  }
  if (tone === "complete") {
    return "bg-muted-foreground";
  }
  return "bg-destructive";
}

function statusBadgeVariant(
  status: ReturnType<typeof buildReminderLines>[number]["status"],
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "live") {
    return "default";
  }
  if (status === "sent") {
    return "secondary";
  }
  if (status === "planned") {
    return "outline";
  }
  if (status === "failed" || status === "absent") {
    return "destructive";
  }
  return "outline";
}

export function BookingReminderStatus({
  leadId,
  scheduledAt,
  category,
  jobs,
}: BookingReminderStatusProps) {
  const [open, setOpen] = useState(false);

  const lines = useMemo(
    () =>
      leadId
        ? buildReminderLines({
            scheduledAt,
            category,
            jobs,
          })
        : [],
    [category, jobs, leadId, scheduledAt],
  );

  const tone = reminderMarkerTone(lines);
  const live = sequenceIsLive(lines);

  if (!leadId) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative size-8"
        disabled
        aria-label="Relances email indisponibles"
      >
        <Mail className="size-4" />
        <span
          className="absolute top-1 right-1 size-2 rounded-full bg-destructive"
          aria-hidden="true"
        />
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative size-8"
          aria-label="Voir les relances email"
        >
          <Mail className="size-4" />
          <span
            className={cn(
              "absolute top-1 right-1 size-2 rounded-full",
              markerDotClass(tone),
            )}
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <Card className="border-0 shadow-none">
          <CardHeader className="relative gap-1 pb-3">
            <CardTitle className="text-sm font-medium">Relances email</CardTitle>
            <p className="text-xs text-muted-foreground">
              {live ? "Séquence live" : "Séquence inactive ou absente"}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 size-7"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              <X className="size-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune relance planifiée pour ce booking.
              </p>
            ) : (
              lines.map((line) => (
                <div key={line.emailType} className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{line.label}</span>
                    <Badge variant={statusBadgeVariant(line.status)} className="text-xs">
                      {reminderStatusLabel(line.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{line.detail}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
