"use client";

import type { SceneProps } from "../presentation/types";
import { ChronologyBoard } from "../shared/ChronologyBoard";

/** S10 — Le temps. Nœuds 0–2 de la barre partagée. */
export function S10_JohnDemo({ step }: SceneProps) {
  return <ChronologyBoard section="S10" step={step} />;
}
