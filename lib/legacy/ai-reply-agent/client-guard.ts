import { findClientByEmail } from "@/lib/clients/appointments/find-host";

export const REPLY_AGENT_CLIENT_SKIP_REASON =
  "Paying client (public.clients) — reply agent disabled";

export async function isReplyAgentProtectedClient(email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  const client = await findClientByEmail(normalized);
  return client !== null;
}
