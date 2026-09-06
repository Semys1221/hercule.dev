"use client";

import * as React from "react";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import type { ComponentEntry } from "@/lib/admin/architecture/types";

import { ComponentPreviewPanel } from "./component-preview-panel";
import { ComponentsTable } from "./components-table";

export function ComponentsInventoryView() {
  const [selectedEntry, setSelectedEntry] = React.useState<ComponentEntry | null>(
    null,
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[640px] rounded-lg border">
      <ResizablePanel defaultSize={42} minSize={30} maxSize={60}>
        <div className="h-full overflow-auto p-4">
          <ComponentsTable
            selectedEntryId={selectedEntry?.id ?? null}
            onSelectEntry={setSelectedEntry}
          />
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={58} minSize={35}>
        <div className="h-full p-4">
          <ComponentPreviewPanel entry={selectedEntry} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
