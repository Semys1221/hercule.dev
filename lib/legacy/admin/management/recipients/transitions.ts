import type { ManagementPhase } from "./types";
import { meetingSequenceSlugForNiche } from "@/lib/legacy/admin/email-sequences/registry";
import type { Niche } from "@/lib/legacy/admin/navigation";
import { phaseForSequenceSlug } from "./phase-map";

const PHASE_ORDER: ManagementPhase[] = ["outreach", "booking", "client"];

export function nextPhaseForSlug(slug: string): ManagementPhase | null {
  const phase = phaseForSequenceSlug(slug);
  if (!phase) {
    return null;
  }
  const index = PHASE_ORDER.indexOf(phase);
  if (index < 0 || index >= PHASE_ORDER.length - 1) {
    return null;
  }
  return PHASE_ORDER[index + 1];
}

export function isValidPhaseTransition(fromSlug: string, toSlug: string): boolean {
  const fromPhase = phaseForSequenceSlug(fromSlug);
  const toPhase = phaseForSequenceSlug(toSlug);
  if (!fromPhase || !toPhase) {
    return false;
  }
  const fromIndex = PHASE_ORDER.indexOf(fromPhase);
  const toIndex = PHASE_ORDER.indexOf(toPhase);
  return toIndex === fromIndex + 1;
}

export function defaultBookingSlugForNiche(niche: Niche): string {
  return meetingSequenceSlugForNiche(niche);
}
