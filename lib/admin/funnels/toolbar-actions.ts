import { funnelEditorHref } from "@/lib/admin/funnels/routing";
import type { FunnelStatus } from "@/lib/admin/funnels/schema";
import { PARCOURS_ALREADY_LIVE } from "@/lib/admin/funnels/ui-copy";

export type ToolbarActionState =
  | { enabled: true }
  | { enabled: false; reason: string };

export type FunnelToolbarContext = "list" | "editor";

export type FunnelToolbarActionStates = {
  edit: ToolbarActionState & { href?: string };
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
      promote:
        status === "published"
          ? { enabled: false, reason: PARCOURS_ALREADY_LIVE }
          : { enabled: true },
    };
  }

  return {
    edit: { enabled: false, reason: "Déjà en édition" },
    promote:
      status === "published"
        ? { enabled: false, reason: PARCOURS_ALREADY_LIVE }
        : { enabled: true },
  };
}
