import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Audience } from "@/lib/admin/navigation";

import {
  type SalesSessionSettingsDocument,
  salesSessionSettingsDocumentSchema,
} from "./sales-session-settings-types";

const CONTENT_DIR = join(process.cwd(), "content", "funnels");

function settingsFilePath(audience: Audience): string {
  return join(CONTENT_DIR, audience, "sales", "session-settings.json");
}

export function createDefaultSalesSessionSettings(audience: Audience): SalesSessionSettingsDocument {
  return {
    schemaVersion: 1,
    audience,
    updatedAt: new Date().toISOString(),
    preparation: { content: "" },
    waitingQueue: { enabled: false },
  };
}

export function getWaitingQueueBlockedDays(
  settings: SalesSessionSettingsDocument,
): 6 | 15 {
  return settings.waitingQueue.enabled ? 15 : 6;
}

export function readSalesSessionSettings(audience: Audience): SalesSessionSettingsDocument {
  try {
    const raw = readFileSync(settingsFilePath(audience), "utf-8");
    return salesSessionSettingsDocumentSchema.parse(JSON.parse(raw));
  } catch {
    return createDefaultSalesSessionSettings(audience);
  }
}

export function writeSalesSessionSettings(
  document: SalesSessionSettingsDocument,
): SalesSessionSettingsDocument {
  const parsed = salesSessionSettingsDocumentSchema.parse(document);
  const filePath = settingsFilePath(parsed.audience);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf-8");
  return parsed;
}

export type { SalesSessionSettingsDocument } from "./sales-session-settings-types";
export { salesSessionSettingsDocumentSchema } from "./sales-session-settings-types";
