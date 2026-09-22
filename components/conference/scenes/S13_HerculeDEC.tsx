"use client";

import type { SceneProps } from "../presentation/types";
import { OfferPair } from "../shared/OfferPair";

/** S13 — Hercule DEC. Quatre actes, un beat à la fois. */
export function S13_HerculeDEC({ step }: SceneProps) {
  return <OfferPair edition="DEC" step={step} />;
}
