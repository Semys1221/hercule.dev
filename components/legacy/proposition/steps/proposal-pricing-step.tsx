"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { StepLayout } from "@/components/legacy/proposition/steps/step-layout";
import { Badge } from "@/components/ui/badge";
import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PropositionPricing, PropositionPricingOption } from "@/lib/legacy/propositions/schema";

type ProposalPricingStepProps = {
  pricing: PropositionPricing;
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  selectedOptionId: string | null;
  onOptionSelect: (optionId: string) => void;
  paymentLinkUrl: string;
};

function PricingOptionCard({
  option,
  selected,
  onSelect,
  index,
}: {
  option: PropositionPricingOption;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.35 }}
      onClick={onSelect}
      className={cn(
        "relative w-full overflow-hidden rounded-xl border p-5 text-left transition-colors",
        selected
          ? "border-indigo-500/60 bg-indigo-500/10 ring-1 ring-indigo-500/40"
          : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700",
      )}
    >
      {option.recommended ? (
        <>
          <Badge className="mb-3 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20">
            Recommandé
          </Badge>
          <BorderBeam
            colorFrom="#6366f1"
            colorTo="#818cf8"
            duration={4}
            size={60}
            borderWidth={1.5}
          />
        </>
      ) : null}

      <p className="text-sm font-medium text-zinc-200">{option.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-50">
        {option.amountLabel}
      </p>

      <ul className="mt-4 space-y-2">
        {option.details.map((detail) => (
          <li key={detail} className="flex items-start gap-2 text-sm text-zinc-400">
            <Check className="mt-0.5 size-3.5 shrink-0 text-indigo-400" aria-hidden />
            <span>{detail}</span>
          </li>
        ))}
      </ul>

      {selected ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-indigo-500"
        >
          <Check className="size-3.5 text-white" aria-hidden />
        </motion.div>
      ) : null}
    </motion.button>
  );
}

export function ProposalPricingStep({
  pricing,
  accepted,
  onAcceptedChange,
  selectedOptionId,
  onOptionSelect,
  paymentLinkUrl,
}: ProposalPricingStepProps) {
  const options = pricing.options;
  const subtitle =
    options && options.length > 0
      ? "Choisissez la formule adaptée à votre palier de démarrage."
      : pricing.amountLabel;
  const hasSelectedOption = options ? selectedOptionId !== null : true;
  const canPay = accepted && hasSelectedOption;

  return (
    <StepLayout
      title={pricing.title}
      subtitle={subtitle}
      confirmId="accept-pricing"
      confirmLabel="Je valide le prix et les conditions présentées"
      accepted={accepted}
      onAcceptedChange={onAcceptedChange}
    >
      <div className="space-y-6">
        {options && options.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {options.map((option, index) => (
              <PricingOptionCard
                key={option.id}
                option={option}
                index={index}
                selected={selectedOptionId === option.id}
                onSelect={() => onOptionSelect(option.id)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-3xl font-semibold tracking-tight text-zinc-50">
              {pricing.amountLabel}
            </p>
            <ul className="space-y-2">
              {pricing.details.map((detail, index) => (
                <motion.li
                  key={detail}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="text-sm text-zinc-300"
                >
                  {detail}
                </motion.li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 border-t border-zinc-800 pt-6">
          {canPay ? (
            <Button asChild size="lg" className="w-full sm:w-auto min-w-[280px]">
              <a href={paymentLinkUrl} target="_blank" rel="noopener noreferrer">
                Commencer mon acquisition
              </a>
            </Button>
          ) : (
            <Button size="lg" className="w-full sm:w-auto min-w-[280px]" disabled>
              Commencer mon acquisition
            </Button>
          )}
          {!canPay ? (
            <p className="text-center text-xs text-zinc-500">
              {hasSelectedOption
                ? "Cochez la validation pour activer le paiement."
                : "Sélectionnez une formule pour continuer."}
            </p>
          ) : null}
        </div>
      </div>
    </StepLayout>
  );
}
