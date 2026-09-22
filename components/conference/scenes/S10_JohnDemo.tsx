"use client";

import type { SceneProps } from "../presentation/types";
import { ChronologyBoard } from "../shared/ChronologyBoard";

/** S10 — Le temps. Deux nœuds de chronologie. */
export function S10_JohnDemo({ step }: SceneProps) {
  return <ChronologyBoard section="S10" step={step} />;
}
