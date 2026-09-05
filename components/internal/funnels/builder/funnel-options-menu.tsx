"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FunnelFullPreviewSheet } from "@/components/internal/funnels/builder/funnel-full-preview-sheet";
import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import type { FunnelCatalog } from "@/lib/admin/funnels/catalog-types";
import { funnelListHref } from "@/lib/admin/funnels/routing";
import { funnelToolbarActions } from "@/lib/admin/funnels/toolbar-actions";
import type { FunnelDocument, FunnelScope } from "@/lib/admin/funnels/schema";

type FunnelOptionsMenuProps = {
  scope: FunnelScope;
  navPath: string[];
  slug: string;
  displayName: string;
  status: "draft" | "published";
  context: "list" | "editor";
  catalog?: FunnelCatalog | null;
  funnel?: FunnelDocument | null;
  onPublished?: () => void;
  onDeleted?: () => void;
  onError?: (message: string) => void;
};

export function FunnelOptionsMenu({
  scope,
  navPath,
  slug,
  displayName,
  status,
  context,
  catalog,
  funnel,
  onPublished,
  onDeleted,
  onError,
}: FunnelOptionsMenuProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const actions = funnelToolbarActions(context, status, navPath, slug);

  async function handlePromote() {
    setBusy(true);
    try {
      const response = await fetch(funnelApiUrl(`/${slug}/publish`, scope), {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Erreur de promotion");
      }
      onPublished?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Erreur de promotion");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      const response = await fetch(funnelApiUrl(`/${slug}`, scope), {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Erreur de suppression");
      }
      if (context === "editor") {
        router.push(funnelListHref(navPath));
        return;
      }
      onDeleted?.();
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Erreur de suppression");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <InternalResourceToolbar
        edit={actions.edit}
        preview={actions.preview}
        promote={actions.promote}
        delete={{
          enabled: true,
          confirmTitle: `Supprimer « ${displayName} » ?`,
          confirmDescription:
            "Cette action est irréversible. Le dossier JSON local du funnel sera supprimé définitivement.",
        }}
        busy={busy}
        onPreview={() => setPreviewOpen(true)}
        onPromote={handlePromote}
        onDeleteConfirm={handleDelete}
      />

      {context === "editor" && funnel && catalog ? (
        <FunnelFullPreviewSheet
          funnel={funnel}
          catalog={catalog}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      ) : null}
    </>
  );
}
