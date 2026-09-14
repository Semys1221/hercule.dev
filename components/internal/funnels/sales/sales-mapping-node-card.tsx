"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import type { MappingNode, MappingNodeKind } from "@/lib/admin/funnels/sales-mapping-tree";
import { cn } from "@/lib/utils";

const COMPACT_CARD_CLASS = `${RESERVATION_SURFACE} gap-0 py-0 shadow-none cursor-pointer transition-shadow hover:ring-1 hover:ring-border`;

type SalesMappingNodeCardProps = {
  node: MappingNode;
  typeLabel?: string;
  selected?: boolean;
  onSelect: () => void;
};

function kindLabel(kind: MappingNodeKind): string {
  return kind === "gate" ? "porte" : "étape";
}

export function SalesMappingNodeCard({
  node,
  typeLabel,
  selected = false,
  onSelect,
}: SalesMappingNodeCardProps) {
  return (
    <Card
      className={cn(COMPACT_CARD_CLASS, selected && "ring-1 ring-primary")}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
    >
      <CardContent className="space-y-2 px-5 py-4 md:px-6 md:py-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {node.id}
          </Badge>
          {typeLabel ? (
            <Badge variant="secondary" className="text-[10px] uppercase">
              {typeLabel}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] uppercase">
              {kindLabel(node.kind)}
            </Badge>
          )}
        </div>
        <p className="text-sm font-medium leading-snug text-foreground">{node.title}</p>
        {node.condition ? (
          <p className="text-xs text-muted-foreground">{node.condition}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
