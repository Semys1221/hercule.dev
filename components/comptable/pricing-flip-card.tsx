"use client";

import { useState, type ReactNode } from "react";
import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PricingFlipCardProps = {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  flipFrontLabel?: string;
  flipBackLabel?: string;
  onFlipChange?: (flipped: boolean) => void;
};

export function PricingFlipCard({
  front,
  back,
  className,
  flipFrontLabel = "Voir le Pack 3 mois",
  flipBackLabel = "Revenir à Hercule Lite",
  onFlipChange,
}: PricingFlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  function toggleFlip(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFlipped((current) => {
      const next = !current;
      onFlipChange?.(next);
      return next;
    });
  }

  return (
    <div className={cn("group/pricing-flip relative h-full", className)}>
      <div className="relative h-full min-h-[420px] [perspective:1200px]">
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <div
            className={cn(
              "h-full [backface-visibility:hidden]",
              flipped && "pointer-events-none absolute inset-0",
            )}
            aria-hidden={flipped}
          >
            {front}
          </div>
          <div
            className={cn(
              "h-full [transform:rotateY(180deg)] [backface-visibility:hidden]",
              !flipped && "pointer-events-none absolute inset-0",
            )}
            aria-hidden={!flipped}
          >
            {back}
          </div>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="absolute top-3 right-3 z-20 gap-1.5 border-white/10 bg-[#0A0A0A]/90 text-neutral-300 hover:bg-white/[0.06] hover:text-white"
        onClick={toggleFlip}
        aria-expanded={flipped}
        aria-label={flipped ? flipBackLabel : flipFrontLabel}
      >
        <RotateCw className="size-3.5" aria-hidden />
        <span className="text-xs">{flipped ? flipBackLabel : flipFrontLabel}</span>
      </Button>
    </div>
  );
}
