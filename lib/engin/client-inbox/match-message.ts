import type { ClientEmailIndex } from "./client-email-index";
import { resolveClientForEmail } from "./client-email-index";
import { getMailboxEmail } from "./gmail-client";
import { normalizeEmailAddress } from "./normalize-email";
import type { ClientEmailMatch, ParsedGmailMessage } from "./types";

export function matchMessageToClient(
  index: ClientEmailIndex,
  message: ParsedGmailMessage,
): ClientEmailMatch | null {
  const mailbox = getMailboxEmail();
  const from = normalizeEmailAddress(message.fromEmail);
  const direction = from === mailbox ? "out" : "in";

  if (direction === "in") {
    if (!from || from === mailbox) return null;
    const hit = resolveClientForEmail(index, from);
    if (!hit) return null;
    return { clientId: hit.clientId, ambiguous: hit.ambiguous };
  }

  for (const to of message.toEmails) {
    const hit = resolveClientForEmail(index, to);
    if (hit) {
      return { clientId: hit.clientId, ambiguous: hit.ambiguous };
    }
  }
  return null;
}

export function messageDirection(
  message: ParsedGmailMessage,
): "in" | "out" {
  const mailbox = getMailboxEmail();
  const from = normalizeEmailAddress(message.fromEmail);
  if (from === mailbox) return "out";
  return "in";
}
