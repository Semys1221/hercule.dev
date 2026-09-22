"use client";

import type { SceneProps } from "../presentation/types";
import { ChronologyBoard } from "../shared/ChronologyBoard";

/** S12 — Infrastructures. Nœuds 3–7 de la barre partagée. */
export function S12_OffersTransition({ step }: SceneProps) {
  return <ChronologyBoard section="S12" step={step} />;
}
