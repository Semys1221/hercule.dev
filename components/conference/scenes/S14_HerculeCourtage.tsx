"use client";

import type { SceneProps } from "../presentation/types";
import { OfferPair } from "../shared/OfferPair";

/** S14 — Hercule Courtage. DEC replié en score, puis les mêmes quatre actes. */
export function S14_HerculeCourtage({ step }: SceneProps) {
  return <OfferPair edition="Courtage" step={step} />;
}
