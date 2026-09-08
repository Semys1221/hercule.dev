"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { bookingRowActionState } from "@/lib/calendly/booking-row-actions";
import type { SalesCallStatus } from "@/lib/sales-calls/types";

type BookingRowTogglesProps = {
  inviteeUri: string;
  salesCallStatus: SalesCallStatus | null;
  pendingNoShow: boolean;
  onNoShowChange: (checked: boolean) => void;
};

export function BookingRowToggles({
  inviteeUri,
  salesCallStatus,
  pendingNoShow,
  onNoShowChange,
}: BookingRowTogglesProps) {
  const actions = bookingRowActionState(salesCallStatus);
  const noShowId = `no-show-${inviteeUri}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Switch
          id={noShowId}
          checked={actions.isNoShow}
          disabled={!actions.canToggleNoShow || pendingNoShow}
          onCheckedChange={onNoShowChange}
          aria-label="No show"
        />
        <Label htmlFor={noShowId} className="text-xs font-normal text-muted-foreground">
          No show
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={actions.isPaid}
          disabled
          aria-label="Paid"
        />
        <Label className="text-xs font-normal text-muted-foreground">Paid</Label>
      </div>
    </div>
  );
}
