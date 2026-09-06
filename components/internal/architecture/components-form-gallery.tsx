"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/utils";
import type { ComponentEntry } from "@/lib/admin/architecture/types";
import {
  getFormComponents,
  getPreviewKind,
} from "@/lib/admin/architecture/component-preview-registry";

import { ComponentPreviewPanel } from "./component-preview-panel";

export function ComponentsFormGallery() {
  const formEntries = React.useMemo(() => getFormComponents(), []);
  const defaultId =
    formEntries.find((entry) => entry.id === "dashboard-onboarding-form")?.id ??
    formEntries[0]?.id ??
    null;
  const [selectedId, setSelectedId] = React.useState<string | null>(defaultId);

  const selectedEntry =
    formEntries.find((entry) => entry.id === selectedId) ?? null;

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[560px] rounded-lg border">
      <ResizablePanel defaultSize={32} minSize={24} maxSize={45}>
        <div className="flex h-full flex-col gap-3 overflow-auto p-4">
          <p className="text-sm text-muted-foreground">
            Formulaires du registre — preview interactive ou stub.
          </p>
          {formEntries.map((entry) => {
            const kind = getPreviewKind(entry);
            const isSelected = entry.id === selectedId;

            return (
              <Card
                key={entry.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/30",
                  isSelected && "border-primary bg-muted/20",
                )}
                onClick={() => setSelectedId(entry.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-sm">{entry.name}</CardTitle>
                    <Badge variant={kind === "live" ? "default" : "secondary"}>
                      {kind === "live" ? "Live" : kind === "stub" ? "Stub" : "—"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <code className="text-xs text-muted-foreground">{entry.id}</code>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={68} minSize={40}>
        <div className="h-full p-4">
          <ComponentPreviewPanel entry={selectedEntry} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
