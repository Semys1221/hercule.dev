import type { Audience } from "@/lib/legacy/admin/navigation";

import { SalesPitchOriginScene } from "./sales-pitch-origin-scene";

type SalesPitchOriginSceneLazyProps = {
  audience: Audience;
};

export function SalesPitchOriginSceneLazy({ audience }: SalesPitchOriginSceneLazyProps) {
  return <SalesPitchOriginScene audience={audience} />;
}
