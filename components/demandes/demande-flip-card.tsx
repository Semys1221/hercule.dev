"use client";

import { useState, type ReactNode } from "react";
import { HelpCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DEMANDE_VERSO_CRITERIA,
  type DemandeVersoFields,
} from "@/lib/commercial/qualification-criteria";
import { cn } from "@/lib/utils";

type DemandeFlipCardVariant = "marketing" | "internal";

type DemandeFlipCardProps = {
  variant: DemandeFlipCardVariant;
  recto: ReactNode;
  versoFields: DemandeVersoFields;
  className?: string;
  disabled?: boolean;
  onFlipChange?: (flipped: boolean) => void;
};

function getVersoValue(
  key: (typeof DEMANDE_VERSO_CRITERIA)[number]["key"],
  versoFields: DemandeVersoFields,
): string {
  return versoFields[key];
}

function VersoContent({
  variant,
  versoFields,
}: {
  variant: DemandeFlipCardVariant;
  versoFields: DemandeVersoFields;
}) {
  const isMarketing = variant === "marketing";

  return (
    <div className="flex h-full min-h-[260px] flex-col gap-0 overflow-hidden rounded-2xl py-0">
      <div
        className={cn(
          "border-b px-5 py-4",
          isMarketing ? "border-zinc-800" : "border-border",
        )}
      >
        <p
          className={cn(
            "text-sm font-medium",
            isMarketing ? "text-white" : "text-foreground",
          )}
        >
          Critères de qualification
        </p>
        <p
          className={cn(
            "mt-1 text-xs",
            isMarketing ? "text-zinc-500" : "text-muted-foreground",
          )}
        >
          Validés lors de la Live Qualification téléphonique
        </p>
      </div>
      <div className="flex flex-1 flex-col divide-y overflow-y-auto">
        {DEMANDE_VERSO_CRITERIA.map((criterion) => (
          <div key={criterion.key} className="space-y-1 px-5 py-4">
            <p
              className={cn(
                "text-sm font-medium",
                isMarketing ? "text-white" : "text-foreground",
              )}
            >
              {criterion.title}
            </p>
            <p
              className={cn(
                "text-xs leading-relaxed",
                isMarketing ? "text-zinc-500" : "text-muted-foreground",
              )}
            >
              {criterion.description}
            </p>
            <p
              className={cn(
                "text-sm",
                isMarketing ? "text-zinc-300" : "text-foreground",
              )}
            >
              {getVersoValue(criterion.key, versoFields)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DemandeFlipCard({
  variant,
  recto,
  versoFields,
  className,
  disabled = false,
  onFlipChange,
}: DemandeFlipCardProps) {
  const [flipped, setFlipped] = useState(false);
  const isMarketing = variant === "marketing";

  function toggleFlip(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    setFlipped((current) => {
      const next = !current;
      onFlipChange?.(next);
      return next;
    });
  }

  const shellClassName = cn(
    "relative h-full min-h-[260px] gap-0 overflow-hidden rounded-2xl py-0 shadow-none transition-[border-color,background-color,box-shadow,opacity] duration-150 ease-out",
    isMarketing
      ? "border-zinc-800 bg-zinc-900/50"
      : "border-border bg-card",
    className,
  );

  const flipButtonClassName = cn(
    "absolute top-3 right-3 z-20 size-7 rounded-full shadow-sm",
    isMarketing
      ? "border-zinc-700 bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
  );

  return (
    <div
      className={cn(
        "group/flip relative h-full",
        disabled && "pointer-events-none",
      )}
    >
      <div className="relative h-full min-h-[260px] [perspective:1200px]">
        <div
          className={cn(
            "relative h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none [transform-style:preserve-3d]",
            flipped && "[transform:rotateY(180deg)]",
          )}
        >
          <Card
            className={cn(
              shellClassName,
              "[backface-visibility:hidden]",
              flipped && "pointer-events-none absolute inset-0",
            )}
            aria-hidden={flipped}
          >
            {recto}
            {!disabled ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={flipButtonClassName}
                onClick={toggleFlip}
                aria-label="Voir les critères de qualification"
                aria-expanded={flipped}
              >
                <HelpCircle className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </Card>

          <Card
            className={cn(
              shellClassName,
              "[transform:rotateY(180deg)] [backface-visibility:hidden]",
              !flipped && "pointer-events-none absolute inset-0",
            )}
            aria-hidden={!flipped}
          >
            <VersoContent variant={variant} versoFields={versoFields} />
            {!disabled ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                className={flipButtonClassName}
                onClick={toggleFlip}
                aria-label="Revenir au recto de la carte"
                aria-expanded={flipped}
              >
                <HelpCircle className="size-3.5" aria-hidden />
              </Button>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  );
}
