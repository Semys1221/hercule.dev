import type { SupabaseClient } from "@supabase/supabase-js";

import { findClientById } from "@/lib/clients/supabase";

export type DeleteConferenceClientResult = {
  id: string;
  slug: string;
  email: string;
};

export async function deleteConferenceClient(params: {
  supabase: SupabaseClient;
  clientId: string;
}): Promise<DeleteConferenceClientResult> {
  const clientId = params.clientId.trim();
  if (!clientId) {
    throw new Error("Invalid client id");
  }

  const row = await findClientById(params.supabase, clientId);
  if (!row) {
    throw new Error("Client not found");
  }

  const { error: jobsError } = await params.supabase
    .from("booking_email_jobs")
    .delete()
    .eq("lead_category", "client")
    .eq("lead_id", clientId);

  if (jobsError) {
    throw new Error(jobsError.message);
  }

  const { data: deleted, error: deleteError } = await params.supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .select("id")
    .maybeSingle();

  if (deleteError) {
    throw new Error(deleteError.message);
  }
  if (!deleted) {
    throw new Error("Client delete failed");
  }

  return { id: row.id, slug: row.slug, email: row.email };
}
