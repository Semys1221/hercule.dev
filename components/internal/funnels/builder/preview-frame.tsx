import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PreviewFrameProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function PreviewFrame({ label, children, className }: PreviewFrameProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Preview — {label}
      </p>
      <div className="overflow-hidden rounded-lg border bg-muted/20">{children}</div>
    </div>
  );
}
