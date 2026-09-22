export function questionsFromPairs(
  pairs: Array<{ question: string; answer: string }>,
): Record<string, string> {
  const questions: Record<string, string> = {};
  for (const item of pairs) {
    if (item.question) questions[item.question] = item.answer ?? "";
  }
  return questions;
}

export function formatParisDate(iso: string | null | undefined): string {
  if (!iso) return "date à confirmer";
  const date = new Date(iso);
  if (!Number.isFinite(date.getTime())) return "date à confirmer";
  return date.toLocaleString("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatQuestionsBlock(
  questions: Record<string, string> | null | undefined,
): string {
  const entries = Object.entries(questions ?? {}).filter(
    ([question]) => question.trim(),
  );
  if (entries.length === 0) {
    return "(aucune réponse au questionnaire)";
  }
  return entries
    .map(([question, answer]) => `${question}\n${answer || "—"}`)
    .join("\n\n");
}

export function hostEmailsFromScheduledEvent(
  scheduled: Record<string, unknown> | null | undefined,
): string[] {
  if (!scheduled) return [];
  const emails = new Set<string>();
  const memberships = scheduled.event_memberships;
  if (Array.isArray(memberships)) {
    for (const item of memberships) {
      if (!item || typeof item !== "object") continue;
      const email = String(
        (item as { user_email?: unknown }).user_email ?? "",
      )
        .trim()
        .toLowerCase();
      if (email) emails.add(email);
    }
  }
  return [...emails];
}

export function scheduledEventFromCreatedPayload(
  payload: unknown,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;
  const body = payload as { payload?: Record<string, unknown> };
  const invitee = body.payload ?? {};
  const scheduled = invitee.scheduled_event;
  if (!scheduled || typeof scheduled !== "object") return null;
  return scheduled as Record<string, unknown>;
}

export function eventTypeUriFromScheduled(
  scheduled: Record<string, unknown> | null,
): string | null {
  if (!scheduled) return null;
  const raw = scheduled.event_type;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object" && "uri" in raw) {
    const uri = String((raw as { uri?: unknown }).uri ?? "").trim();
    return uri || null;
  }
  return null;
}

export function eventUriFromScheduled(
  scheduled: Record<string, unknown> | null,
): string | null {
  if (!scheduled) return null;
  const uri = String(scheduled.uri ?? "").trim();
  return uri || null;
}
