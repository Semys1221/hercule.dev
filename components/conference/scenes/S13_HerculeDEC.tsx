"use client";

import type { SceneProps } from "../presentation/types";
import { OfferPair } from "../shared/OfferPair";

/** S13 — Hercule DEC. Une ligne de plus à chaque beat. */
export function S13_HerculeDEC({ step }: SceneProps) {
  return <OfferPair edition="DEC" step={step} />;
}
