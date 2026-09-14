"use client";

import { ChevronDown, ChevronUp, PanelLeft } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { SalesFunnelProgress } from "./sales-funnel-progress";

type SalesImmersiveSessionShellProps = {
  progressValue: number;
  stepNumber: number;
  totalSteps: number;
  title?: ReactNode;
  description?: ReactNode;
  coachCue?: string;
  chart?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  canGoPrev: boolean;
  canGoNext: boolean;
  nextLabel?: string;
  onPrev: () => void;
  onNext: () => void;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
  contentClassName?: string;
  layout?: "stacked" | "split";
};

export function SalesImmersiveSessionShell({
  progressValue,
  title,
  description,
  chart,
  children,
  footer,
  canGoPrev,
  canGoNext,
  nextLabel,
  onPrev,
  onNext,
  onOpenSidebar,
  sidebarOpen = false,
  contentClassName,
  layout = "stacked",
}: SalesImmersiveSessionShellProps) {
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background via-card/40 to-background"
      />
      {onOpenSidebar ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute left-3 top-3 z-20 size-9 text-muted-foreground hover:text-foreground"
          aria-label={
            sidebarOpen ? "Fermer le menu des étapes" : "Ouvrir le menu des étapes"
          }
          aria-pressed={sidebarOpen}
          onClick={onOpenSidebar}
        >
          <PanelLeft className="size-4" />
        </Button>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-8 md:px-10 md:py-10",
          layout === "split" && "lg:flex-row lg:items-center lg:gap-10 lg:overflow-hidden",
          contentClassName,
        )}
      >
        <div
          className={cn(
            "flex w-full flex-col gap-6",
            layout === "split" && "lg:min-w-0 lg:flex-1 lg:justify-center",
          )}
        >
          {title ? (
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 text-center">
              <h2 className="text-2xl font-medium tracking-tight md:text-3xl">{title}</h2>
              {description ? (
                <p className="text-sm text-muted-foreground md:text-base">{description}</p>
              ) : null}
            </div>
          ) : null}

          {chart ? (
            <div
              className={cn(
                "mx-auto w-full",
                layout === "split" ? "max-w-sm lg:order-2 lg:mx-0 lg:shrink-0" : "max-w-4xl",
              )}
            >
              {chart}
            </div>
          ) : null}

          <div
            className={cn(
              "mx-auto w-full max-w-3xl",
              layout === "split" && "lg:order-1 lg:mx-0",
            )}
          >
            {children}
          </div>
        </div>
      </div>

      {footer ? <div className="relative z-10 shrink-0 px-6 pb-6 md:px-10">{footer}</div> : null}

      <div className="relative z-20 flex shrink-0 items-center justify-between gap-3 border-t border-border/40 px-6 py-6 md:px-10 md:py-8">
        <Button
          type="button"
          variant="outline"
          disabled={!canGoPrev}
          aria-label="Étape précédente"
          onClick={onPrev}
        >
          <ChevronUp className="mr-2 size-4" />
          Précédent
        </Button>
        <SalesFunnelProgress value={progressValue} className="mx-auto" />
        <Button
          type="button"
          disabled={!canGoNext}
          aria-label={nextLabel ?? "Étape suivante"}
          onClick={onNext}
        >
          {nextLabel ?? "Suivant"}
          <ChevronDown className="ml-2 size-4" />
        </Button>
      </div>
    </div>
  );
}
