import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type NotificationDocument = {
  id: string;
  subject: string;
  body: string;
};

function contentPath(id: string): string {
  return join(process.cwd(), "lib", "(resend)", "notifications", "content", `${id}.md`);
}

export function readNotification(id: string): NotificationDocument {
  const raw = readFileSync(contentPath(id), "utf-8");
  const trimmed = raw.trimStart();
  if (!trimmed.startsWith("---")) {
    return { id, subject: "", body: raw.trim() };
  }
  const end = trimmed.indexOf("\n---", 3);
  if (end < 0) {
    return { id, subject: "", body: raw.trim() };
  }
  const meta = JSON.parse(trimmed.slice(3, end).trim()) as { subject?: string };
  const body = trimmed.slice(end + 4).replace(/^\n/, "").trimEnd();
  return { id, subject: meta.subject ?? "", body };
}

export function writeNotification(document: NotificationDocument): void {
  const payload = `---\n${JSON.stringify({ subject: document.subject }, null, 2)}\n---\n\n${document.body.trim()}\n`;
  writeFileSync(contentPath(document.id), payload, "utf-8");
}

export function renderNotification(
  id: string,
  vars: Record<string, string>,
): { subject: string; text: string } {
  const document = readNotification(id);
  const fill = (value: string) =>
    value.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => vars[key] ?? "");
  return { subject: fill(document.subject), text: fill(document.body) };
}
