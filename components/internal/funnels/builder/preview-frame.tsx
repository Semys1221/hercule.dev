import type { ReactNode } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PreviewFrameProps = {
  label: string;
  children: ReactNode;
  className?: string;
};

export function PreviewFrame({ label, children, className }: PreviewFrameProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Preview — {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="bg-muted/20 p-0">{children}</CardContent>
    </Card>
  );
}
