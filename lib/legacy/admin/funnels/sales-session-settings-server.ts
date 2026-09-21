import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import type { Audience } from "@/lib/legacy/admin/navigation";

import { FUNNELS_ROOT } from "@/app/(legacy)/content/paths";

import {
  type SalesSessionSettingsDocument,
  salesSessionSettingsDocumentSchema,
} from "./sales-session-settings-types";

const CONTENT_DIR = FUNNELS_ROOT;

export const DEFAULT_PREPARATION_CONTENT = `- Ouvrir Calendly
- Ouvrir Google Meet et Zoom
- Ouvrir le site web du client
- Séparer la fenêtre de présentation sales dans une nouvelle fenêtre
- Tester le micro et le casque`;

function settingsFilePath(audience: Audience): string {
  return join(CONTENT_DIR, audience, "sales", "session-settings.json");
}

export function createDefaultSalesSessionSettings(audience: Audience): SalesSessionSettingsDocument {
  return {
    schemaVersion: 1,
    audience,
    updatedAt: new Date().toISOString(),
    preparation: { content: DEFAULT_PREPARATION_CONTENT },
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
