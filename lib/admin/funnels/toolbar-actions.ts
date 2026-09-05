import { funnelEditorHref } from "@/lib/admin/funnels/routing";
import type { FunnelStatus } from "@/lib/admin/funnels/schema";

export type ToolbarActionState =
  | { enabled: true }
  | { enabled: false; reason: string };

export type FunnelToolbarContext = "list" | "editor";

export type FunnelToolbarActionStates = {
  edit: ToolbarActionState & { href?: string };
  preview: ToolbarActionState;
  promote: ToolbarActionState;
};

export function funnelToolbarActions(
  context: FunnelToolbarContext,
  status: FunnelStatus,
  navPath: string[],
  slug: string,
): FunnelToolbarActionStates {
  if (context === "list") {
    return {
      edit: {
        enabled: true,
        href: funnelEditorHref(navPath, slug, { phase: "layout" }),
      },
      preview: {
        enabled: false,
        reason: "Ouvrir l'éditeur pour prévisualiser le funnel",
      },
      promote:
        status === "published"
          ? { enabled: false, reason: "Ce funnel est déjà en live" }
          : { enabled: true },
    };
  }

  return {
    edit: { enabled: false, reason: "Déjà en édition" },
    preview: { enabled: true },
    promote:
      status === "published"
        ? { enabled: false, reason: "Ce funnel est déjà en live" }
        : { enabled: true },
  };
}
