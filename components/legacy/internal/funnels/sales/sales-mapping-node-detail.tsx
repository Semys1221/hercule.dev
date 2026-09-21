"use client";

import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { MappingNodeDetail } from "@/lib/legacy/admin/funnels/sales-mapping-tree";

type SalesMappingNodeDetailProps = {
  detail: MappingNodeDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SalesMappingNodeDetail({
  detail,
  open,
  onOpenChange,
}: SalesMappingNodeDetailProps) {
  if (!detail) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] uppercase">
              {detail.id}
            </Badge>
            {detail.type ? (
              <Badge variant="secondary" className="text-[10px] uppercase">
                {detail.type}
              </Badge>
            ) : null}
            {detail.part ? (
              <Badge variant="secondary" className="text-[10px] uppercase">
                {detail.part}
              </Badge>
            ) : null}
          </div>
          <DialogTitle>{detail.title}</DialogTitle>
          {detail.prompt && detail.prompt !== detail.title ? (
            <DialogDescription>{detail.prompt}</DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="space-y-4 text-sm">
          {detail.condition ? (
            <section className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Condition d&apos;affichage
              </p>
              <p className="text-foreground">{detail.condition}</p>
            </section>
          ) : null}

          {detail.description ? (
            <section className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Description
              </p>
              <p className="whitespace-pre-wrap text-foreground">{detail.description}</p>
            </section>
          ) : null}

          {detail.options && detail.options.length > 0 ? (
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Options
              </p>
              <ul className="space-y-1">
                {detail.options.map((option) => (
                  <li key={option.id} className="flex gap-2 text-foreground">
                    <span className="font-mono text-xs text-muted-foreground">{option.id}</span>
                    <span>{option.label}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {detail.dynamicOptionsNote ? (
            <section className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Options dynamiques
              </p>
              <p className="text-foreground">{detail.dynamicOptionsNote}</p>
              {detail.dynamicOptionsByMethod?.map((group) => (
                <div key={group.methodId} className="space-y-1 rounded-md border border-border p-3">
                  <p className="text-xs font-medium text-foreground">{group.methodLabel}</p>
                  <ul className="space-y-1">
                    {group.options.map((option) => (
                      <li key={option.id} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{option.id}</span>
                        <span>{option.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ) : null}

          {detail.coachCue ? (
            <section className="space-y-1">
              <Separator />
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Coach cue
              </p>
              <p className="text-foreground">{detail.coachCue}</p>
            </section>
          ) : null}

          {detail.trainingNote ? (
            <section className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Note formation
              </p>
              <p className="text-foreground">{detail.trainingNote}</p>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
