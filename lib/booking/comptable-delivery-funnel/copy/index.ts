import type { FunnelRouteSegment } from "../schema";
import { btpCopy } from "./btp";
import { dentisteCopy } from "./dentiste";
import { restaurantCopy } from "./restaurant";
import type { VerticalCopyBundle } from "./types";

const BY_ROUTE: Record<FunnelRouteSegment, VerticalCopyBundle> = {
  restaurant: restaurantCopy,
  btp: btpCopy,
  "chirurgien-dentiste": dentisteCopy,
};

export function getFunnelCopy(routeSegment: FunnelRouteSegment): VerticalCopyBundle {
  const bundle = BY_ROUTE[routeSegment];
  if (!bundle) {
    throw new Error(`Unknown funnel route segment: ${routeSegment}`);
  }
  return bundle;
}

export type { StepCopy, VerticalCopyBundle } from "./types";
