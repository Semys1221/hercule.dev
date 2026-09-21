import { COMMERCIAL_COMPTABLE } from "@/lib/commercial/constants";
import { formatFrenchDate } from "@/lib/legacy/retraction/dates";

import { MS_DAY } from "./constants";

export function estimateFirstRdvDateLabel(paymentAt: Date): string {
  const midDays = Math.round(
    (COMMERCIAL_COMPTABLE.firstRdvDaysMin + COMMERCIAL_COMPTABLE.firstRdvDaysMax) / 2,
  );
  const estimated = new Date(paymentAt.getTime() + midDays * MS_DAY);
  return formatFrenchDate(estimated);
}
