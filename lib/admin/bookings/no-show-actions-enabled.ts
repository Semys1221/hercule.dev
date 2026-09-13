import type { Niche } from "@/lib/admin/navigation";

export const NO_SHOW_ACTIONS_DISABLED_TOOLTIP =
  "Impossible de modifier le statut no-show pour ce rendez-vous.";

/** No-show marking is independent of meeting confirmation sequences. */
export function noShowActionsEnabled(_niche: Niche): boolean {
  return true;
}
