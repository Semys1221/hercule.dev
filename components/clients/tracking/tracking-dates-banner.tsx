import { CalendarClock, Flag } from "lucide-react";

import { formatTrackingLong } from "@/lib/clients/tracking/script";

type TrackingDatesBannerProps = {
  deliveryAt: Date | null;
  volumeEndAt: Date | null;
  rdvTotal: number;
  frozen: boolean;
};

export function TrackingDatesBanner({
  deliveryAt,
  volumeEndAt,
  rdvTotal,
  frozen,
}: TrackingDatesBannerProps) {
  if (frozen || !deliveryAt || !volumeEndAt) {
    return null;
  }

  return (
    <div
      className="border-t border-border/50"
      aria-label="Dates de livraison"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-stretch sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <CalendarClock className="size-3.5 shrink-0 text-tracking-soft" aria-hidden />
            Premier rendez-vous
          </span>
          <p className="text-lg font-semibold tracking-tight text-tracking">
            {formatTrackingLong(deliveryAt)}
          </p>
        </div>
        <div
          className="hidden w-px shrink-0 bg-border/60 sm:block"
          aria-hidden
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <Flag className="size-3.5 shrink-0 text-tracking-soft" aria-hidden />
            Fin des {rdvTotal} rendez-vous
          </span>
          <p className="text-lg font-semibold tracking-tight text-tracking">
            {formatTrackingLong(volumeEndAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
