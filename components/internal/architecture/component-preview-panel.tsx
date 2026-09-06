"use client";

import { EyeOffIcon } from "lucide-react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { ComponentEntry } from "@/lib/admin/architecture/types";
import {
  getPreviewKind,
  renderPreview,
} from "@/lib/admin/architecture/component-preview-registry";

import { PreviewFrame } from "./preview-frame";

type ComponentPreviewPanelProps = {
  entry: ComponentEntry | null;
};

export function ComponentPreviewPanel({ entry }: ComponentPreviewPanelProps) {
  if (!entry) {
    return (
      <Empty className="h-full min-h-[320px] border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <EyeOffIcon />
          </EmptyMedia>
          <EmptyTitle>Aucun composant sélectionné</EmptyTitle>
          <EmptyDescription>
            Sélectionnez une ligne dans l&apos;inventaire pour afficher la preview.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const kind = getPreviewKind(entry);
  const preview = renderPreview(entry);

  if (kind === "unavailable" || !preview) {
    return (
      <Empty className="h-full min-h-[320px] border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <EyeOffIcon />
          </EmptyMedia>
          <EmptyTitle>Preview non disponible</EmptyTitle>
          <EmptyDescription>
            {entry.name} ({entry.kind}) — route{" "}
            <code className="text-xs">{entry.route}</code>
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <PreviewFrame label={entry.name} className="h-full">
      <div className="max-h-[calc(100vh-280px)] overflow-auto">{preview}</div>
    </PreviewFrame>
  );
}
