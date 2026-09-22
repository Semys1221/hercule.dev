import type { SupabaseClient } from "@supabase/supabase-js";

import { reportAppointmentNoshow } from "@/lib/clients/appointments/actions";
import { findClientBySlug } from "@/lib/clients/supabase";
import type { ClientRow } from "@/lib/clients/types";

export type ReportNoshowResult = {
  client: ClientRow;
  rdvUsed: number;
  rdvTotal: number;
  refunded: boolean;
};

export async function reportClientNoshow(params: {
  supabase: SupabaseClient;
  slug: string;
  appointmentId: string;
}): Promise<ReportNoshowResult> {
  const appointmentId = params.appointmentId.trim();
  if (!appointmentId) {
    throw new Error("appointmentId is required");
  }

  await reportAppointmentNoshow({
    slug: params.slug,
    appointmentId,
  });

  const client = await findClientBySlug(params.supabase, params.slug);
  if (!client) {
    throw new Error("Client not found");
  }

  return {
    client,
    rdvUsed: client.rdv_used,
    rdvTotal: client.rdv_total,
    refunded: true,
  };
}
