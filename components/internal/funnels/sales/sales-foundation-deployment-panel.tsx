"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  FOUNDATION_CALENDRIER_CLOSER_COPY,
  FOUNDATION_DEPLOYMENT_PHASES,
  FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
} from "@/lib/admin/funnels/comptable-sales-copy";
import {
  CIF_FOUNDATION_CALENDRIER_CLOSER_COPY,
  CIF_FOUNDATION_DEPLOYMENT_PHASES,
  CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES,
} from "@/lib/admin/funnels/cif-sales-copy";
import type { Audience } from "@/lib/admin/navigation";
import { isCifSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import { cn } from "@/lib/utils";

import type { SalesClosingValues } from "./sales-closing-sections";

const CALENDRIER_CHECKBOX_LABEL =
  "Calendrier susceptible d'être modifié en fonction des disponibilités des deux parties";

type SalesFoundationDeploymentPanelProps = {
  audience: Audience;
  closingValues: SalesClosingValues;
  saving: boolean;
  persistTieDown: (patch: Partial<SalesClosingValues>) => Promise<void>;
};

export function SalesFoundationDeploymentPanel({
  audience,
  closingValues,
  saving,
  persistTieDown,
}: SalesFoundationDeploymentPanelProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const isCif = isCifSalesAudience(audience);
  const phases = isCif ? CIF_FOUNDATION_DEPLOYMENT_PHASES : FOUNDATION_DEPLOYMENT_PHASES;
  const weeklyLines = isCif
    ? CIF_FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES
    : FOUNDATION_DEPLOYMENT_WEEKLY_REPORT_LINES;
  const closerCopy = isCif
    ? CIF_FOUNDATION_CALENDRIER_CLOSER_COPY
    : FOUNDATION_CALENDRIER_CLOSER_COPY;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted-foreground">
        Déploiement Foundation sur 60 jours — 3 phases visibles pour le cabinet.
      </p>

      <div className="space-y-4">
        {phases.map((phase, index) => (
          <Card key={phase.id} className={cn(RESERVATION_SURFACE, "shadow-none")}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <CardTitle className="text-base">{phase.title}</CardTitle>
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {phase.window}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {phase.artifacts.map((artifact) => (
                  <li key={artifact}>{artifact}</li>
                ))}
              </ul>
              {index < 2 ? (
                <p className="text-xs text-muted-foreground">
                  {weeklyLines[index * 2]} · {weeklyLines[index * 2 + 1]}
                </p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">{closerCopy}</p>

      <AnimatePresence>
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.35, ease: "easeOut" }}
          className="flex items-start gap-3"
        >
          <Checkbox
            id="calendrierAccepted"
            checked={closingValues.calendrierAccepted}
            onCheckedChange={(checked) => {
              void persistTieDown({ calendrierAccepted: checked === true });
            }}
            disabled={saving}
          />
          <Label htmlFor="calendrierAccepted" className="text-sm font-normal leading-relaxed">
            {CALENDRIER_CHECKBOX_LABEL}
          </Label>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
