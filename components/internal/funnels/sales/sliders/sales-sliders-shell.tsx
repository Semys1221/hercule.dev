"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff, PanelLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SalesFunnelProgress } from "../sales-funnel-progress";

type SalesSlidersShellProps = {
  progressValue: number;
  stepNumber: number;
  totalSteps: number;
  title?: ReactNode;
  canvas: ReactNode;
  presenterMode: boolean;
  canGoPrev: boolean;
  canGoNext: boolean;
  nextLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  onTogglePresenter: () => void;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
};

export function SalesSlidersShell({
  progressValue,
  title,
  canvas,
  presenterMode,
  canGoPrev,
  canGoNext,
  nextLabel,
  onPrev,
  onNext,
  onTogglePresenter,
  onOpenSidebar,
  sidebarOpen = false,
}: SalesSlidersShellProps) {
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

      if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        onTogglePresenter();
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
  }, [canGoNext, canGoPrev, onNext, onPrev, onTogglePresenter]);

  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col bg-background",
        presenterMode && "fixed inset-0 z-40",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background"
      />

      {!presenterMode && onOpenSidebar ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-3 top-3 z-20 size-9 text-muted-foreground hover:text-foreground"
          aria-label={sidebarOpen ? "Fermer le menu des étapes" : "Ouvrir le menu des étapes"}
          aria-pressed={sidebarOpen}
          onClick={onOpenSidebar}
        >
          <PanelLeft className="size-4" />
        </Button>
      ) : null}

      {!presenterMode ? (
        <div className="absolute right-3 top-3 z-20 flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9"
            aria-label={presenterMode ? "Quitter le mode présentateur" : "Mode présentateur"}
            onClick={onTogglePresenter}
          >
            {presenterMode ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 z-20 size-9 text-muted-foreground"
          aria-label="Quitter le mode présentateur (F)"
          onClick={onTogglePresenter}
        >
          <EyeOff className="size-4" />
        </Button>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto px-6 py-10 md:px-12 md:py-12">
          {title ? (
            <div className="mx-auto mb-8 w-full max-w-5xl text-center">
              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{title}</h2>
            </div>
          ) : null}
          <div className="mx-auto w-full max-w-5xl">{canvas}</div>
        </div>
      </div>

      {!presenterMode ? (
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
      ) : null}
    </div>
  );
}
