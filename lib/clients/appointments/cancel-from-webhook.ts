import { createLinkTrackingClient } from "@/lib/legacy/link-tracking/supabase";

import { decrementClientRdvUsed } from "./credits";
import { findClientAppointmentByInviteeUri, updateClientAppointment } from "./store";

export async function tryCancelClientDeliveryAppointment(params: {
  inviteeUri: string;
}): Promise<{ handled: boolean }> {
  if (!params.inviteeUri) {
    return { handled: false };
  }
  const supabase = createLinkTrackingClient();
  const appointment = await findClientAppointmentByInviteeUri(
    params.inviteeUri,
    supabase,
  );
  if (!appointment) {
    return { handled: false };
  }
  if (appointment.status !== "scheduled") {
    return { handled: true };
  }

  await updateClientAppointment(
    appointment.id,
    { status: "canceled" },
    supabase,
  );

  if (appointment.credited) {
    await decrementClientRdvUsed(appointment.client_id, supabase);
    await updateClientAppointment(
      appointment.id,
      { credited: false },
      supabase,
    );
  }

  return { handled: true };
}
