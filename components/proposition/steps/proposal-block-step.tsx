"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { PropositionVisual } from "@/components/proposition/visuals/proposition-visual";
import { StepLayout } from "@/components/proposition/steps/step-layout";
import type { PropositionBlock } from "@/lib/propositions/schema";

type ProposalBlockStepProps = {
  block: PropositionBlock;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
};

export function ProposalBlockStep({
  block,
  accepted,
  onAcceptedChange,
}: ProposalBlockStepProps) {
  return (
    <StepLayout
      title={block.title}
      subtitle={block.description}
      confirmId={`accept-${block.id}`}
      confirmLabel="Je valide ce bloc de la proposition"
      accepted={accepted}
      onAcceptedChange={onAcceptedChange}
    >
      {block.visual ? (
        <PropositionVisual visual={block.visual} />
      ) : (
        <ul className="space-y-3">
          {block.bullets.map((bullet, index) => (
            <motion.li
              key={bullet}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.12, duration: 0.35 }}
              className="flex items-start gap-3 rounded-lg border border-zinc-800/50 bg-zinc-950/30 px-4 py-3"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.12 + 0.1, type: "spring", stiffness: 260 }}
              >
                <Check className="mt-0.5 size-4 shrink-0 text-indigo-400" aria-hidden />
              </motion.span>
              <span className="text-sm leading-relaxed text-zinc-200">{bullet}</span>
            </motion.li>
          ))}
        </ul>
      )}
    </StepLayout>
  );
}
