import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import { cn } from "@/lib/utils";

export const IMMERSIVE_SURFACE_CLASS = "rounded-lg border border-border/40";

type PitchSurfacePanelProps = {
  immersive?: boolean;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function PitchSurfacePanel({
  immersive,
  children,
  className,
  contentClassName,
}: PitchSurfacePanelProps) {
  if (immersive) {
    return (
      <div className={cn(IMMERSIVE_SURFACE_CLASS, "p-5", className, contentClassName)}>
        {children}
      </div>
    );
  }

  return (
    <Card className={cn(RESERVATION_SURFACE, "shadow-none", className)}>
      <CardContent className={cn("p-5", contentClassName)}>{children}</CardContent>
    </Card>
  );
}
