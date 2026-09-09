"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  WORKFLOW_SEQUENCES_DISABLED_TOOLTIP,
  workflowSequencesEnabled,
} from "@/lib/admin/bookings/workflow-sequences-enabled";
import { bookingRowActionState } from "@/lib/calendly/booking-row-actions";
import type { Niche } from "@/lib/admin/navigation";
import type { SalesCallStatus } from "@/lib/sales-calls/types";

type BookingRowTogglesProps = {
  niche: Niche;
  inviteeUri: string;
  salesCallStatus: SalesCallStatus | null;
  pendingNoShow: boolean;
  onNoShowChange: (checked: boolean) => void;
};

export function BookingRowToggles({
  niche,
  inviteeUri,
  salesCallStatus,
  pendingNoShow,
  onNoShowChange,
}: BookingRowTogglesProps) {
  const actions = bookingRowActionState(salesCallStatus);
  const noShowId = `no-show-${inviteeUri}`;
  const sequencesEnabled = workflowSequencesEnabled(niche);
  const noShowDisabled =
    !sequencesEnabled || !actions.canToggleNoShow || pendingNoShow;

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-2"
        title={!sequencesEnabled ? WORKFLOW_SEQUENCES_DISABLED_TOOLTIP : undefined}
      >
        <Switch
          id={noShowId}
          checked={actions.isNoShow}
          disabled={noShowDisabled}
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
