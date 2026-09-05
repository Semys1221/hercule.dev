"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EditTicketDialog } from "@/components/internal/funnels/builder/edit-ticket-dialog";
import { LayoutPreview } from "@/components/internal/funnels/builder/preview-registry";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import type { LayoutCatalogEntry } from "@/lib/admin/funnels/catalog-types";
import type { FunnelDocument, FunnelScope } from "@/lib/admin/funnels/schema";

type LayoutPickerProps = {
  scope: FunnelScope;
  funnel: FunnelDocument;
  layouts: LayoutCatalogEntry[];
  onSaved: (funnel: FunnelDocument) => void;
  onContinue: () => void;
};

export function LayoutPicker({
  scope,
  funnel,
  layouts,
  onSaved,
  onContinue,
}: LayoutPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(funnel.layoutId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LayoutCatalogEntry | null>(null);

  async function saveLayout(layoutId: string) {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(funnelApiUrl(`/${funnel.slug}`, scope), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ layoutId }),
      });
      const body = (await response.json()) as {
        funnel?: FunnelDocument;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Erreur de sauvegarde");
      }
      setSelectedId(layoutId);
      if (body.funnel) {
        onSaved(body.funnel);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  async function submitEditTicket(params: {
    command: string;
    cursorImpact: "light" | "medium" | "high";
    componentPath: string | null;
  }) {
    const response = await fetch("/api/admin/funnels/edits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience: scope.audience,
        kind: scope.kind,
        stage: scope.stage,
        funnelSlug: funnel.slug,
        ticketKind: "layout",
        componentPath: params.componentPath,
        command: params.command,
        cursorImpact: params.cursorImpact,
      }),
    });
    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? "Erreur ticket layout");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Choisir un layout</h2>
        <p className="text-sm text-muted-foreground">
          Le thème global n&apos;est pas personnalisable par funnel.
        </p>
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {layouts.map((layout) => (
          <Card
            key={layout.id}
            className={selectedId === layout.id ? "ring-2 ring-primary" : undefined}
          >
            <CardHeader>
              <CardTitle className="text-base">{layout.label}</CardTitle>
              <CardDescription>{layout.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <LayoutPreview layout={layout} />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={() => void saveLayout(layout.id)}
                >
                  Sélectionner
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditTarget(layout);
                    setEditOpen(true);
                  }}
                >
                  Brief layout
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" onClick={() => setCreateOpen(true)}>
        Create new layout
      </Button>

      <div className="flex justify-end">
        <Button disabled={!selectedId} onClick={onContinue}>
          Continuer — mapper les étapes
        </Button>
      </div>

      <EditTicketDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        title="Modifier le layout"
        description="Le composant TSX ne sera pas modifié ici. Un brief JSON sera créé pour Cursor."
        onSubmit={async (values) => {
          await submitEditTicket({
            command: values.command,
            cursorImpact: values.cursorImpact,
            componentPath: editTarget?.componentPath ?? null,
          });
        }}
      />

      <EditTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Créer un layout"
        description="Décrivez le nouveau layout. Cursor générera le composant dans le repo."
        onSubmit={async (values) => {
          await submitEditTicket({
            command: values.command,
            cursorImpact: values.cursorImpact,
            componentPath: null,
          });
        }}
      />
    </div>
  );
}
