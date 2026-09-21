"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import { StepLayout } from "@/components/legacy/proposition/steps/step-layout";
import { AnimatedCircularProgressBar } from "@/components/ui/animated-circular-progress-bar";
import { NumberTicker } from "@/components/ui/number-ticker";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { PropositionRoi } from "@/lib/legacy/propositions/schema";

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

const ROI_SLIDER_CLASSNAME =
  "[&_[data-slot=slider-track]]:bg-zinc-700/80 [&_[data-slot=slider-range]]:bg-indigo-500 [&_[data-slot=slider-thumb]]:border-indigo-400 [&_[data-slot=slider-thumb]]:bg-white";

export function ProposalRoiStep({ roi, accepted, onAcceptedChange }: ProposalRoiStepProps) {
  const sliders = roi.sliders;
  const [prospects, setProspects] = useState(sliders?.prospectsDefault ?? 15);
  const [honoraire, setHonoraire] = useState(sliders?.honoraireDefault ?? 300);
  const prospectsSliderRef = useRef<HTMLDivElement>(null);

  const monthlyRevenue = useMemo(() => prospects * honoraire, [prospects, honoraire]);
  const convertedClients = useMemo(() => Math.round(prospects * 0.5), [prospects]);
  const conversionRate = 50;

  const prospectsMin = sliders?.prospectsMin ?? 5;
  const prospectsMax = sliders?.prospectsMax ?? 30;
  const honoraireMin = sliders?.honoraireMin ?? 150;
  const honoraireMax = sliders?.honoraireMax ?? 600;

  useEffect(() => {
    if (!sliders) {
      return;
    }

    const sliderRoot = prospectsSliderRef.current?.querySelector('[data-slot="slider"]');
    const track = sliderRoot?.querySelector('[data-slot="slider-track"]');
    const range = sliderRoot?.querySelector('[data-slot="slider-range"]');
    const trackWidth = track?.getBoundingClientRect().width ?? 0;
    const rangeWidth = range?.getBoundingClientRect().width ?? 0;

    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c521a9" },
      body: JSON.stringify({
        sessionId: "c521a9",
        runId: "pre-fix",
        hypothesisId: "H1",
        location: "proposal-roi-step.tsx:mount",
        message: "ROI slider visual metrics",
        data: {
          prospects,
          prospectsMin,
          prospectsMax,
          rangeWidthRatio: trackWidth > 0 ? rangeWidth / trackWidth : null,
          trackBg: track ? getComputedStyle(track).backgroundColor : null,
          rangeBg: range ? getComputedStyle(range).backgroundColor : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [prospects, prospectsMax, prospectsMin, sliders]);

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
            <div ref={prospectsSliderRef} className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <Label className="text-zinc-300">{sliders.prospectsLabel ?? "Nombre de profils / mois"}</Label>
                <span className="font-medium text-zinc-100">{prospects}</span>
              </div>
              <Slider
                className={ROI_SLIDER_CLASSNAME}
                value={[prospects]}
                min={prospectsMin}
                max={prospectsMax}
                step={1}
                onValueChange={(value) => {
                  const next = value[0] ?? prospectsMin;
                  setProspects(next);
                  // #region agent log
                  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "c521a9" },
                    body: JSON.stringify({
                      sessionId: "c521a9",
                      runId: "pre-fix",
                      hypothesisId: "H2",
                      location: "proposal-roi-step.tsx:prospects-change",
                      message: "Prospects slider value change",
                      data: { next, prospectsMin, prospectsMax },
                      timestamp: Date.now(),
                    }),
                  }).catch(() => {});
                  // #endregion
                }}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{prospectsMin}</span>
                <span>{prospectsMax}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <Label className="text-zinc-300">{sliders.honoraireLabel ?? "Honoraire mensuel moyen (€)"}</Label>
                <span className="font-medium text-zinc-100">{honoraire} €</span>
              </div>
              <Slider
                className={ROI_SLIDER_CLASSNAME}
                value={[honoraire]}
                min={honoraireMin}
                max={honoraireMax}
                step={10}
                onValueChange={(value) => setHonoraire(value[0] ?? honoraireMin)}
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>{formatEuros(honoraireMin)}</span>
                <span>{formatEuros(honoraireMax)}</span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-6 text-center"
            >
              <p className="text-sm text-zinc-400">{sliders.revenueLabel ?? "CA mensuel projeté"}</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-indigo-300">
                <NumberTicker value={monthlyRevenue} /> €
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {sliders.revenueSubLabel
                  ? sliders.revenueSubLabel.replace("{prospects}", String(prospects)).replace("{honoraire}", formatEuros(honoraire))
                  : `${prospects} profils × ${formatEuros(honoraire)}/mois`}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex items-center gap-5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-5 py-4"
            >
              <AnimatedCircularProgressBar
                value={conversionRate}
                max={100}
                gaugePrimaryColor="#6366f1"
                gaugeSecondaryColor="rgba(99,102,241,0.12)"
                className="size-16 shrink-0"
              />
              <div>
                <p className="text-sm font-semibold text-zinc-100">
                  ~{convertedClients} clients convertis
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Taux de conversion estimé : 50 % · réactif au slider
                </p>
              </div>
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
