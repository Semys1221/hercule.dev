"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InternalResourceToolbar } from "@/components/internal/funnels/ui/internal-resource-toolbar";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import { funnelListHref } from "@/lib/admin/funnels/routing";
import { funnelToolbarActions } from "@/lib/admin/funnels/toolbar-actions";
import type { FunnelDocument, FunnelScope } from "@/lib/admin/funnels/schema";
import { PARCOURS_DELETE_WARNING } from "@/lib/admin/funnels/ui-copy";

type FunnelOptionsMenuProps = {
  scope: FunnelScope;
  navPath: string[];
  slug: string;
  displayName: string;
  status: "draft" | "published";
  context: "list" | "editor";
  catalog?: unknown;
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
  onPublished,
  onDeleted,
  onError,
}: FunnelOptionsMenuProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

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
    <InternalResourceToolbar
      edit={actions.edit}
      preview={{ enabled: false, reason: "Preview non disponible" }}
      promote={actions.promote}
      delete={{
        enabled: true,
        confirmTitle: `Supprimer « ${displayName} » ?`,
        confirmDescription: PARCOURS_DELETE_WARNING,
      }}
      busy={busy}
      onPromote={handlePromote}
      onDeleteConfirm={handleDelete}
    />
  );
}
