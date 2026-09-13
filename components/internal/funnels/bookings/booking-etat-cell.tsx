import { Badge } from "@/components/ui/badge";
import type { BookingLocalDoc } from "@/lib/admin/bookings/booking-local-docs";
import { resolveBookingEtat } from "@/lib/admin/bookings/booking-etat";
import type { SalesCallStatus } from "@/lib/sales-calls/types";

type BookingEtatCellProps = {
  statut: string | null | undefined;
  salesCallStatus: SalesCallStatus | null;
  localDoc?: BookingLocalDoc | null;
  calendlyCanceled?: boolean;
};

export function BookingEtatCell({
  statut,
  salesCallStatus,
  localDoc,
  calendlyCanceled = false,
}: BookingEtatCellProps) {
  const etat = resolveBookingEtat(
    statut,
    salesCallStatus,
    localDoc?.lostVariant ?? null,
    calendlyCanceled,
  );

  if (etat.label === "—") {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Badge variant={etat.variant} className="w-fit font-normal">
        {etat.label}
      </Badge>
      {localDoc?.note ? (
        <p className="line-clamp-2 text-xs text-muted-foreground" title={localDoc.note}>
          {localDoc.note}
        </p>
      ) : null}
    </div>
  );
}
