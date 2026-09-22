"use client";

import type { SceneProps } from "../presentation/types";
import { OfferPair } from "../shared/OfferPair";

/** S14 — Hercule Courtage. DEC reste plein, Courtage se remplit à côté. */
export function S14_HerculeCourtage({ step }: SceneProps) {
  return <OfferPair edition="Courtage" step={step} />;
}
