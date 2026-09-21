"use client";

import * as React from "react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { ComponentsFormGallery } from "./components-form-gallery";
import { ComponentsInventoryView } from "./components-inventory-view";

type ComponentsView = "form" | "all";

export function ComponentsPageShell() {
  const [view, setView] = React.useState<ComponentsView>("form");

  return (
    <div className="flex flex-col gap-6">
      <ToggleGroup
        type="single"
        variant="outline"
        value={view}
        onValueChange={(value) => {
          if (value === "form" || value === "all") {
            setView(value);
          }
        }}
      >
        <ToggleGroupItem value="form" aria-label="Formulaires">
          Form
        </ToggleGroupItem>
        <ToggleGroupItem value="all" aria-label="Tous les composants">
          All
        </ToggleGroupItem>
      </ToggleGroup>

      {view === "form" ? <ComponentsFormGallery /> : <ComponentsInventoryView />}
    </div>
  );
}
