"use client";

import { Info } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

import { SalesScriptContent } from "./sales-script-content";

type SalesCoachCalloutProps = {
  script: string;
  className?: string;
};

export function SalesCoachCallout({ script, className }: SalesCoachCalloutProps) {
  return (
    <Alert className={cn(className)}>
      <Info />
      <AlertTitle>À lire au prospect</AlertTitle>
      <AlertDescription>
        <SalesScriptContent text={script} />
      </AlertDescription>
    </Alert>
  );
}
