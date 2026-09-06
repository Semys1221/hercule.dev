"use client";

import { useState } from "react";

import { FaqLiveInventory } from "@/components/internal/funnels/faq-live-inventory";
import { FaqMasterTable } from "@/components/internal/funnels/faq-master-table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { FaqAudience } from "@/lib/site/faq-types";

type FaqManagementShellProps = {
  audience: FaqAudience;
};

type FaqView = "tout" | "live";

export function FaqManagementShell({ audience }: FaqManagementShellProps) {
  const [view, setView] = useState<FaqView>("tout");

  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup
        type="single"
        value={view}
        onValueChange={(value) => {
          if (value) {
            setView(value as FaqView);
          }
        }}
        variant="outline"
      >
        <ToggleGroupItem value="tout">Tout</ToggleGroupItem>
        <ToggleGroupItem value="live">Live</ToggleGroupItem>
      </ToggleGroup>

      {view === "live" ? (
        <FaqLiveInventory audience={audience} />
      ) : (
        <FaqMasterTable audience={audience} />
      )}
    </div>
  );
}
