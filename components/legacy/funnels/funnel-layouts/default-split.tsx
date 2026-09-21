import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DefaultSplitLayoutProps = {
  title?: string;
  stepLabel?: string;
  progress?: number;
  children: ReactNode;
  className?: string;
};

export function DefaultSplitLayout({
  title = "Titre de l'étape",
  stepLabel = "Étape 1 sur 3",
  progress = 33,
  children,
  className,
}: DefaultSplitLayoutProps) {
  return (
    <div className={cn("flex min-h-[280px] flex-col rounded-lg border bg-background", className)}>
      <div className="border-b px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{stepLabel}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground">{title}</h3>
          {children}
        </div>
      </div>
    </div>
  );
}
