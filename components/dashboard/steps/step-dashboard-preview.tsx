"use client";

import { ChronologieSection } from "@/components/dashboard/chronologie-section";
import { DEFAULT_TIMELINE } from "@/lib/admin/clients/types";

const PREVIEW_TIMELINE = DEFAULT_TIMELINE.map((step) => {
  if (step.id === "confirmed") {
    return { ...step, status: "done" as const };
  }
  if (step.id === "setup") {
    return { ...step, status: "active" as const };
  }
  return { ...step, status: "pending" as const };
});

export function StepDashboardPreview() {
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
        showHeader={false}
        steps={PREVIEW_TIMELINE}
        activeStatusLabel="En cours"
      />
    </div>
  );
}
