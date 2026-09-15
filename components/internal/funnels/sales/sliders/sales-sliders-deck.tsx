"use client";

import { useCallback, useMemo, useState } from "react";
import { type UseFormReturn, useWatch } from "react-hook-form";

import { toast } from "@/hooks/use-toast";
import {
  canAdvanceFromSlidersStep,
  getSlidersSlides,
  SLIDERS_STEP_IDS,
  type SlidersOfferId,
} from "@/lib/admin/funnels/sales-sliders";
import {
  mergeSalesQualificationValues,
  type SalesQualificationValues,
} from "@/lib/admin/funnels/sales-qualification-schema";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { buildCabinetCheckoutDashboardUrl } from "@/lib/payments/cabinet-checkout";
import type { Audience } from "@/lib/admin/navigation";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";

import { useSalesSessionDashboardLink } from "../sales-dashboard-link-copy";
import { SalesSlidersCanvas } from "./sales-sliders-canvas";
import { SalesSlidersShell } from "./sales-sliders-shell";

type SalesSlidersDeckProps = {
  audience: Audience;
  form: UseFormReturn<SalesQualificationValues>;
  prospectFirstName?: string;
  department?: string;
  developerModeEnabled?: boolean;
  selectedLead?: LinkTrackingLead | null;
  selectedBooking?: EnrichedCalendlyBooking | null;
  onRefreshLead?: () => Promise<void>;
  immersive?: boolean;
  onOpenSidebar?: () => void;
  sidebarOpen?: boolean;
};

export function SalesSlidersDeck({
  audience,
  form,
  developerModeEnabled = false,
  selectedLead = null,
  selectedBooking = null,
  immersive = false,
  onOpenSidebar,
  sidebarOpen = false,
}: SalesSlidersDeckProps) {
  const watchedPartial = useWatch({ control: form.control });
  const values = mergeSalesQualificationValues(
    watchedPartial as Partial<SalesQualificationValues>,
    audience,
  );

  const slides = useMemo(() => getSlidersSlides(), []);
  const [stepIndex, setStepIndex] = useState(0);
  const [presenterMode, setPresenterMode] = useState(false);

  const safeStepIndex = Math.min(Math.max(stepIndex, 0), slides.length - 1);
  const currentSlide = slides[safeStepIndex];
  const currentStepId = currentSlide?.id ?? SLIDERS_STEP_IDS[0];
  const progressValue = slides.length > 0 ? ((safeStepIndex + 1) / slides.length) * 100 : 0;

  const dashboardLink = useSalesSessionDashboardLink(
    selectedLead,
    selectedBooking,
    developerModeEnabled,
  );

  const canGoNext = currentSlide
    ? canAdvanceFromSlidersStep(currentSlide.id, values)
    : false;
  const canGoPrev = safeStepIndex > 0;

  const handlePrev = useCallback(() => {
    setStepIndex((index) => Math.max(index - 1, 0));
  }, []);

  const handleNext = useCallback(() => {
    const allowed = currentSlide
      ? canAdvanceFromSlidersStep(currentSlide.id, values)
      : false;
    if (!currentSlide || !allowed) {
      return;
    }
    setStepIndex((index) => Math.min(index + 1, slides.length - 1));
  }, [currentSlide, slides.length, values]);

  const handleResetThinkFlow = useCallback(() => {
    form.setValue("sTempCheck", undefined, { shouldDirty: true });
    form.setValue("sThinkBeat1", false, { shouldDirty: true });
    form.setValue("sThinkBeat2", false, { shouldDirty: true });
    form.setValue("sThinkBeat3", false, { shouldDirty: true });
  }, [form]);

  const handleSelectOffer = useCallback(
    async (offer: SlidersOfferId) => {
      if (values.sTempCheck !== "yes") {
        toast({
          title: "Temp check requis",
          description: "Validez le temp check avant de copier un lien de paiement.",
          variant: "destructive",
        });
        return;
      }

      if (!dashboardLink) {
        toast({
          title: "Lien indisponible",
          description: "Associez un lead avec dashboard sur l'étape Rendez-vous.",
          variant: "destructive",
        });
        return;
      }

      const checkoutUrl = buildCabinetCheckoutDashboardUrl(dashboardLink, offer);
      form.setValue("sOffer", offer, { shouldDirty: true });
      form.setValue("sOfferCopiedAt", new Date().toISOString(), { shouldDirty: true });

      try {
        await navigator.clipboard.writeText(checkoutUrl);
        toast({
          title: "Copié — envoie-le maintenant",
          description: checkoutUrl,
        });
      } catch {
        toast({
          title: "Copie impossible",
          description: checkoutUrl,
          variant: "destructive",
        });
      }
    },
    [dashboardLink, form, values.sTempCheck],
  );

  const canvasTitle =
    currentSlide?.type === "goal"
      ? undefined
      : currentSlide?.canvasTitle;

  if (!isCabinetBuyerSalesAudience(audience)) {
    return null;
  }

  return (
    <SalesSlidersShell
      progressValue={progressValue}
      stepNumber={safeStepIndex + 1}
      totalSteps={slides.length}
      title={canvasTitle}
      presenterMode={presenterMode}
      canGoPrev={canGoPrev}
      canGoNext={canGoNext && safeStepIndex < slides.length - 1}
      nextLabel={safeStepIndex === slides.length - 1 ? "Fin" : undefined}
      onPrev={handlePrev}
      onNext={handleNext}
      onTogglePresenter={() => setPresenterMode((open) => !open)}
      onOpenSidebar={immersive ? onOpenSidebar : undefined}
      sidebarOpen={sidebarOpen}
      canvas={
        currentSlide ? (
          <SalesSlidersCanvas
            slide={currentSlide}
            audience={audience}
            form={form}
            values={values}
            selectedOffer={values.sOffer ?? null}
            onSelectOffer={(offer) => void handleSelectOffer(offer)}
            onResetThinkFlow={handleResetThinkFlow}
          />
        ) : null
      }
    />
  );
}
