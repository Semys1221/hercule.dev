import type { ClientInboxThreadStateRow, InboxDirection } from "./types";

export function computeNeedsReply(params: {
  lastDirection: InboxDirection;
  state: Pick<
    ClientInboxThreadStateRow,
    "resolved_at" | "snoozed_until"
  > | null;
  now?: Date;
}): boolean {
  const now = params.now ?? new Date();
  if (params.state?.resolved_at) {
    return false;
  }
  if (params.state?.snoozed_until) {
    const snoozeEnd = new Date(params.state.snoozed_until);
    if (snoozeEnd.getTime() > now.getTime()) {
      return false;
    }
  }
  return params.lastDirection === "in";
}

export function isUnreadEngin(
  state: Pick<ClientInboxThreadStateRow, "read_at"> | null,
): boolean {
  return !state?.read_at;
}
