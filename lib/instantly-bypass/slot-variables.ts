import {
  type CalendlyBookingEvent,
  findNextAvailableSlots,
  formatFrenchSlotLabel,
} from "@/lib/calendly/availability";
import { resolveCategoryForCampaign } from "@/lib/link-tracking/provision-campaign-lead";
import type { LeadCategory } from "@/lib/link-tracking/types";

const SLOT_KEYS = ["slot_1", "slot_2"] as const;

export type SlotTemplateVariables = {
  slot_1: string;
  slot_2: string;
};

export function templateRequiresSlotVariables(bodyHtml: string): boolean {
  const text = bodyHtml ?? "";
  return SLOT_KEYS.some((key) => text.includes(`{{${key}}}`));
}

function categoryToCalendlyEvent(
  category: LeadCategory,
): CalendlyBookingEvent {
  return category;
}

export function buildSlotVariablesFromLabels(
  labels: string[],
): SlotTemplateVariables {
  const slot1 = labels[0]?.trim() ?? "";
  const slot2 = labels[1]?.trim() ?? "";
  return {
    slot_1: slot1,
    slot_2: slot2 || (slot1 ? "un autre créneau" : ""),
  };
}

export async function resolveSlotVariables(
  campaignId: string,
  bodyHtml: string,
): Promise<SlotTemplateVariables> {
  const empty: SlotTemplateVariables = { slot_1: "", slot_2: "" };
  if (!templateRequiresSlotVariables(bodyHtml)) {
    return empty;
  }

  try {
    const category = await resolveCategoryForCampaign(campaignId);
    if (!category) {
      console.warn(
        `[slot-variables] Unknown campaign category for ${campaignId}`,
      );
      // #region agent log
      fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "f685d6",
        },
        body: JSON.stringify({
          sessionId: "f685d6",
          hypothesisId: "H1",
          location: "slot-variables.ts:resolveSlotVariables",
          message: "unknown campaign category",
          data: { campaignId },
          timestamp: Date.now(),
          runId: "pre-fix",
        }),
      }).catch(() => {});
      // #endregion
      return empty;
    }

    const slots = await findNextAvailableSlots(
      categoryToCalendlyEvent(category),
      2,
    );
    const labels = slots.map((slot) => formatFrenchSlotLabel(slot));
    const result = buildSlotVariablesFromLabels(labels);
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f685d6",
      },
      body: JSON.stringify({
        sessionId: "f685d6",
        hypothesisId: "H2",
        location: "slot-variables.ts:resolveSlotVariables",
        message: "resolved calendly slots",
        data: { campaignId, category, slot_1: result.slot_1, slot_2: result.slot_2 },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[slot-variables] Failed to resolve slots: ${message}`);
    // #region agent log
    fetch("http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "f685d6",
      },
      body: JSON.stringify({
        sessionId: "f685d6",
        hypothesisId: "H2",
        location: "slot-variables.ts:resolveSlotVariables",
        message: "calendly slot resolution failed",
        data: { campaignId, error: message },
        timestamp: Date.now(),
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    return empty;
  }
}
