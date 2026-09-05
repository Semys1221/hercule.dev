"use client";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type InternalJsonPreviewProps = {
  label: string;
  data: unknown;
  defaultOpen?: boolean;
  className?: string;
};

export function InternalJsonPreview({
  label,
  data,
  defaultOpen = false,
  className,
}: InternalJsonPreviewProps) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("group/collapsible rounded-md border", className)}>
      <CollapsibleTrigger
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50"
      >
        {label}
        <ChevronDown className="size-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <pre className="overflow-auto whitespace-pre-wrap border-t p-4 text-xs">
          {JSON.stringify(data, null, 2)}
        </pre>
      </CollapsibleContent>
    </Collapsible>
  );
}
