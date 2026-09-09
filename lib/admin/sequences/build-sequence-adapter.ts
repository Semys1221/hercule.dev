import { createBookingAdapter } from "@/components/internal/funnels/sequence-editor/adapters/booking-adapter";
import { createBypassAdapter } from "@/components/internal/funnels/sequence-editor/adapters/bypass-adapter";
import { createReplyAgentAdapter } from "@/components/internal/funnels/sequence-editor/adapters/reply-agent-adapter";
import type { SequenceEditorAdapter } from "@/components/internal/funnels/sequence-editor/types";
import {
  BOOKING_SEQUENCE_SLUGS,
  bookingSequenceTypesFor,
  type EmailSequenceEntry,
} from "@/lib/admin/email-sequences/registry";
import type { Niche } from "@/lib/admin/navigation";
import type { LeadCategory } from "@/lib/link-tracking/types";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

export type BuildSequenceAdapterResult = {
  adapter: SequenceEditorAdapter | null;
  needsCampaign: boolean;
};

function isLeadCategory(value: string): value is LeadCategory {
  return value === "agence" || value === "comptable" || value === "entreprise";
}

export function buildSequenceAdapter(
  sequence: EmailSequenceEntry,
  niche: Niche,
  campaignId: string | null,
): BuildSequenceAdapterResult {
  const needsCampaign =
    sequence.editorKind === "bypass" || sequence.editorKind === "reply_agent";

  if (sequence.editorKind === "booking") {
    const emailTypes = bookingSequenceTypesFor(sequence.slug, niche);
    const rawCategory = sequence.bookingCategory ?? niche;
    if (!isLeadCategory(rawCategory)) {
      return { adapter: null, needsCampaign: false };
    }
    const typedSteps = sequence.steps.filter(
      (step) => step.emailType && emailTypes.includes(step.emailType),
    );
    const stepMeta = (typedSteps.length > 0 ? typedSteps : sequence.steps).map(
      (step) => ({
        id: step.id,
        label: step.label,
        delay: step.delay,
      }),
    );
    return {
      needsCampaign: false,
      adapter: createBookingAdapter({
        slug: sequence.slug,
        niche,
        category: rawCategory,
        emailTypes:
          emailTypes.length > 0
            ? emailTypes
            : (BOOKING_SEQUENCE_SLUGS[sequence.slug] ?? []),
        stepMeta,
      }),
    };
  }

  if (sequence.editorKind === "bypass" && campaignId && sequence.bypassTemplateKeys) {
    const stepMeta = sequence.steps
      .filter((step) => step.templateKey)
      .map((step) => ({
        id: step.id,
        label: step.label,
        delay: step.delay,
        templateKey: step.templateKey as BypassTemplateKey,
      }));
    return {
      needsCampaign: true,
      adapter: createBypassAdapter({
        slug: sequence.slug,
        niche,
        campaignId,
        templateKeys: sequence.bypassTemplateKeys,
        stepMeta,
      }),
    };
  }

  if (sequence.editorKind === "reply_agent" && campaignId) {
    return {
      needsCampaign: true,
      adapter: createReplyAgentAdapter({
        slug: sequence.slug,
        niche,
        campaignId,
      }),
    };
  }

  return { adapter: null, needsCampaign };
}
