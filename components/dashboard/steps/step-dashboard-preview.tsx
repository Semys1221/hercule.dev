"use client";

import { useMemo } from "react";

import { ChronologieSection } from "@/components/dashboard/chronologie-section";
import {
  addWorkingDays,
  formatDashboardTimelineDate,
} from "@/lib/dashboard/working-days";
import { DEFAULT_TIMELINE } from "@/lib/admin/clients/types";

export function StepDashboardPreview() {
  const previewTimeline = useMemo(() => {
    const deliveryDate = formatDashboardTimelineDate(addWorkingDays(new Date(), 7));

    return DEFAULT_TIMELINE.map((step) => {
      if (step.id === "confirmed") {
        return { ...step, status: "done" as const };
      }
      if (step.id === "setup") {
        return { ...step, status: "active" as const };
      }
      if (step.id === "delivery") {
        return {
          ...step,
          status: "pending" as const,
          meta: deliveryDate,
        };
      }
      return { ...step, status: "pending" as const };
    });
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Votre tableau de bord</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi de votre parcours Hercule en temps réel.
        </p>
      </div>

      <ChronologieSection
        layout="horizontal"
        animated
        fillAnimation="reload"
        showHeader={false}
        steps={previewTimeline}
        activeStatusLabel="En cours"
      />
    </div>
  );
}
