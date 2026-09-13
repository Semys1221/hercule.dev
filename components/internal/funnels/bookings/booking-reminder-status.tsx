"use client";

import { useMemo, useState } from "react";
import { Mail, X } from "lucide-react";

import type { BookingEmailJobSummary } from "@/lib/admin/bookings/email-jobs";
import {
  buildReminderLines,
  reminderMarkerTone,
  reminderStatusLabel,
  reminderSummary,
  sequenceIsLive,
} from "@/lib/admin/bookings/reminder-status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const sentCount = lines.filter((line) => line.status === "sent").length;
  const summary = reminderSummary(lines);

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="relative size-8"
      disabled={!leadId}
      aria-label={leadId ? "Voir les relances email" : "Relances email indisponibles"}
    >
      <Mail className="size-4" />
      <span
        className={cn(
          "absolute top-1 right-1 size-2 rounded-full",
          leadId ? markerDotClass(tone) : "bg-destructive",
        )}
        aria-hidden="true"
      />
      {leadId && lines.length > 0 ? (
        <span className="absolute -bottom-1 -right-1 rounded bg-background px-0.5 text-[10px] leading-none text-muted-foreground">
          {sentCount}/{lines.length}
        </span>
      ) : null}
    </Button>
  );

  if (!leadId) {
    return triggerButton;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">{summary}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
