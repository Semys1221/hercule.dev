import type { FunnelKind, VenteStage } from "@/lib/admin/funnels/schema";
import type { Audience } from "@/lib/admin/navigation";

export function funnelScopeQuery(scope: {
  audience: Audience;
  kind: FunnelKind;
  stage: VenteStage | null;
}): string {
  const params = new URLSearchParams({
    audience: scope.audience,
    kind: scope.kind,
  });
  if (scope.kind === "vente" && scope.stage) {
    params.set("stage", scope.stage);
  }
  return params.toString();
}

export function funnelApiUrl(
  path: string,
  scope: {
    audience: Audience;
    kind: FunnelKind;
    stage: VenteStage | null;
  },
): string {
  return `/api/admin/funnels${path}?${funnelScopeQuery(scope)}`;
}
