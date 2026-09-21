"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SalesFunnelProgress } from "../sales-funnel-progress";

type AgenceReventePitchShellProps = {
  progressValue: number;
  title?: ReactNode;
  canvas: ReactNode;
  canvasKey: string;
  canGoPrev: boolean;
  canGoNext: boolean;
  nextLabel?: string;
  sectionTransition: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function AgenceReventePitchShell({
  progressValue,
  title,
  canvas,
  canvasKey,
  canGoPrev,
  canGoNext,
  nextLabel,
  sectionTransition,
  onPrev,
  onNext,
}: AgenceReventePitchShellProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    canvasRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [canvasKey]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "Enter" && canGoNext) {
        event.preventDefault();
        onNext();
        return;
      }

      if (event.key === "ArrowDown" && canGoNext) {
        event.preventDefault();
        onNext();
        return;
      }

      if (event.key === "ArrowUp" && canGoPrev) {
        event.preventDefault();
        onPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canGoNext, canGoPrev, onNext, onPrev]);

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background"
      />

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-6 py-10 md:px-12 md:py-12">
          {title ? (
            <div className="mx-auto mb-8 w-full max-w-4xl shrink-0 text-center">
              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{title}</h2>
            </div>
          ) : null}
          <div
            key={canvasKey}
            ref={canvasRef}
            className={cn(
              "mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col overflow-y-auto scroll-smooth",
              sectionTransition &&
                "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500",
            )}
          >
            {canvas}
          </div>
        </div>
      </div>

      <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-t border-border/40 px-6 py-5 md:px-10">
        <Button type="button" variant="outline" disabled={!canGoPrev} onClick={onPrev}>
          <ChevronUp className="mr-2 size-4" />
          Précédent
        </Button>
        <SalesFunnelProgress value={progressValue} className="mx-auto max-w-xs" />
        <Button type="button" disabled={!canGoNext} onClick={onNext}>
          {nextLabel ?? "Suivant"}
          <ChevronDown className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
