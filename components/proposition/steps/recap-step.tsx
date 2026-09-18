"use client";

import { motion } from "framer-motion";

import { PropositionVisual } from "@/components/proposition/visuals/proposition-visual";
import { StepLayout } from "@/components/proposition/steps/step-layout";
import type { PropositionRecapSlide } from "@/lib/propositions/schema";

const DEFAULT_CONFIRM_LABEL = "Je confirme";

type RecapStepProps = {
  slide: PropositionRecapSlide;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

export function RecapStep({ slide, accepted, onAcceptedChange }: RecapStepProps) {
  const confirmLabel = slide.confirmLabel ?? DEFAULT_CONFIRM_LABEL;
  const subtitle = slide.paragraphs[0] ?? "";

  return (
    <StepLayout
      title={slide.title}
      subtitle={subtitle}
      confirmId={`confirm-${slide.id}`}
      confirmLabel={confirmLabel}
      accepted={accepted}
      onAcceptedChange={onAcceptedChange}
    >
      {slide.visual ? (
        <PropositionVisual visual={slide.visual} />
      ) : (
        <div className="space-y-3">
          {slide.paragraphs.slice(1).map((paragraph, index) => (
            <motion.div
              key={paragraph}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.35 }}
              className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-4 py-3"
            >
              <p className="text-sm leading-relaxed text-zinc-200">{paragraph}</p>
            </motion.div>
          ))}

          {slide.items && slide.items.length > 0 ? (
            <dl className="divide-y divide-zinc-800 rounded-lg border border-zinc-800/60">
              {slide.items.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(0,140px)_1fr] sm:gap-4"
                >
                  <dt className="text-sm font-medium text-zinc-400">{item.label}</dt>
                  <dd className="text-sm text-zinc-100">{item.value}</dd>
                </motion.div>
              ))}
            </dl>
          ) : null}
        </div>
      )}
    </StepLayout>
  );
}
