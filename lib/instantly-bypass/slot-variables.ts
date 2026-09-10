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
      return empty;
    }

    const slots = await findNextAvailableSlots(
      categoryToCalendlyEvent(category),
      2,
    );
    const labels = slots.map((slot) => formatFrenchSlotLabel(slot));
    return buildSlotVariablesFromLabels(labels);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[slot-variables] Failed to resolve slots: ${message}`);
    return empty;
  }
}
