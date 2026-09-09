"use client";

import { useMemo } from "react";

import { createBookingAdapter } from "@/components/internal/funnels/sequence-editor/adapters/booking-adapter";
import { SequenceWorkspace } from "@/components/internal/funnels/sequence-editor/sequence-workspace";
import {
  bookingSequenceTypesFor,
  getEmailSequence,
} from "@/lib/admin/email-sequences/registry";

const MEETING_AGENCE_SLUG = "meeting-agence";

export function ConfirmSequenceTab() {
  const sequence = getEmailSequence(MEETING_AGENCE_SLUG);
  const adapter = useMemo(() => {
    if (!sequence) {
      return null;
    }
    const emailTypes = bookingSequenceTypesFor(sequence.slug, "agence");
    return createBookingAdapter({
      slug: sequence.slug,
      niche: "agence",
      category: "agence",
      emailTypes,
      stepMeta: sequence.steps.map((step) => ({
        id: step.id,
        label: step.label,
        delay: step.delay,
      })),
    });
  }, [sequence]);

  if (!sequence || !adapter) {
    return null;
  }

  return (
    <SequenceWorkspace
      title="Séquence de confirmation — Agence"
      description="Éditez les emails de confirmation (immediate, H-48, H-24, H-20). L'envoi se déclenche manuellement depuis l'onglet Bookings via le bouton « Confirmer »."
      adapter={adapter}
    />
  );
}
