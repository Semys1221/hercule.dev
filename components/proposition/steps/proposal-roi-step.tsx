"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { StepLayout } from "@/components/proposition/steps/step-layout";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { PropositionRoi } from "@/lib/propositions/schema";

type ProposalRoiStepProps = {
  roi: PropositionRoi;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

function formatEuros(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProposalRoiStep({ roi, accepted, onAcceptedChange }: ProposalRoiStepProps) {
  const sliders = roi.sliders;
  const [prospects, setProspects] = useState(sliders?.prospectsDefault ?? 15);
  const [honoraire, setHonoraire] = useState(sliders?.honoraireDefault ?? 300);

  const monthlyRevenue = useMemo(() => prospects * honoraire, [prospects, honoraire]);

  const prospectsMin = sliders?.prospectsMin ?? 5;
  const prospectsMax = sliders?.prospectsMax ?? 30;
  const honoraireMin = sliders?.honoraireMin ?? 150;
  const honoraireMax = sliders?.honoraireMax ?? 600;

  return (
    <StepLayout
      title={roi.title}
      subtitle={roi.summary}
      confirmId="accept-roi"
      confirmLabel="Je valide le retour sur investissement présenté"
      accepted={accepted}
      onAcceptedChange={onAcceptedChange}
    >
      <div className="space-y-6">
        {sliders ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <Label className="text-zinc-300">Nombre de profils / mois</Label>
                <span className="font-medium text-zinc-100">{prospects}</span>
              </div>
              <Slider
                value={[prospects]}
                min={prospectsMin}
                max={prospectsMax}
                step={1}
                onValueChange={(value) => setProspects(value[0] ?? prospectsMin)}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <Label className="text-zinc-300">Honoraire mensuel moyen (€)</Label>
                <span className="font-medium text-zinc-100">{honoraire} €</span>
              </div>
              <Slider
                value={[honoraire]}
                min={honoraireMin}
                max={honoraireMax}
                step={10}
                onValueChange={(value) => setHonoraire(value[0] ?? honoraireMin)}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-6 text-center"
            >
              <p className="text-sm text-zinc-400">CA mensuel projeté</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-indigo-300">
                <NumberTicker value={monthlyRevenue} /> €
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {prospects} profils × {formatEuros(honoraire)}/mois
              </p>
            </motion.div>
          </div>
        ) : (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-semibold tracking-tight text-indigo-300"
          >
            {roi.summary}
          </motion.p>
        )}

        <ul className="space-y-2">
          {roi.details.map((detail, index) => (
            <motion.li
              key={detail}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.08, duration: 0.3 }}
              className="text-sm text-zinc-300"
            >
              {detail}
            </motion.li>
          ))}
        </ul>
      </div>
    </StepLayout>
  );
}
