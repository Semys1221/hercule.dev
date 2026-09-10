"use client";

import { useMemo } from "react";

import { ChronologieSection } from "@/components/dashboard/chronologie-section";
import { formatDashboardTimelineDate } from "@/lib/dashboard/working-days";
import { addCalendarDays } from "@/lib/retraction/dates";

const COMPTABLE_PREVIEW_STEPS = [
  { id: "activation", label: "Activation de votre espace", status: "done" as const },
  { id: "qualification", label: "Qualification des missions", status: "active" as const },
  {
    id: "proposition",
    label: "Première proposition PME",
    status: "pending" as const,
  },
  {
    id: "rdv",
    label: "Rendez-vous planifié",
    status: "pending" as const,
    meta: formatDashboardTimelineDate(addCalendarDays(new Date(), 22)),
  },
];

export function StepDashboardPreviewComptable() {
  const previewTimeline = useMemo(() => COMPTABLE_PREVIEW_STEPS, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Votre tableau de bord</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivi de votre parcours Hercule Comptable en temps réel.
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
