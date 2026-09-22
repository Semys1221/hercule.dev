import type { LeadCategory } from "@/lib/legacy/link-tracking/types";

import { meetingWeekdayParis } from "./schedule";

export type SequenceKind = "main" | "recovery" | "none";

/**
 * Pure meeting → sequence routing. Kept free of server-only imports
 * (orchestrator) so client UI can call it safely.
 */
export function sequenceKindForMeeting(
  scheduledAt: string | null | undefined,
  category: LeadCategory,
): SequenceKind {
  // #region agent log
  fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "23e90c",
    },
    body: JSON.stringify({
      sessionId: "23e90c",
      runId: "post-fix",
      hypothesisId: "H1",
      location: "sequence-kind.ts:sequenceKindForMeeting",
      message: "client-safe sequenceKindForMeeting invoked",
      data: {
        hasScheduledAt: Boolean(scheduledAt?.trim()),
        category,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (!scheduledAt?.trim()) {
    return "none";
  }
  if (category !== "agence") {
    return "main";
  }
  const weekday = meetingWeekdayParis(scheduledAt);
  if (weekday === "Mon" || weekday === "Tue" || weekday === "Wed") {
    return "recovery";
  }
  return "main";
}
