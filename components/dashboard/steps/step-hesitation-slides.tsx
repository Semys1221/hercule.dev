"use client";

import { useCallback, useEffect, useState } from "react";

import { FaqRichText } from "@/components/dashboard/faq-rich-text";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DashboardBleedContext } from "@/lib/dashboard/bleed-context";
import { getHesitationSlides } from "@/lib/dashboard/onboarding-faq";
import type { DashboardFaqAudience } from "@/lib/dashboard/types";

type StepHesitationSlidesProps = {
  open: boolean;
  audience: DashboardFaqAudience;
  bleedContext?: DashboardBleedContext;
  selectedOfferLabel: string;
  onOpenChange: (open: boolean) => void;
  onActivateCheckout: () => void;
};

export function StepHesitationSlides({
  open,
  audience,
  bleedContext,
  selectedOfferLabel,
  onOpenChange,
  onActivateCheckout,
}: StepHesitationSlidesProps) {
  const slides = getHesitationSlides(audience, bleedContext);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const isLastSlide = current >= slides.length - 1;

  const handleActivate = useCallback(() => {
    onOpenChange(false);
    onActivateCheckout();
  }, [onActivateCheckout, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Avant de verrouiller la zone</DialogTitle>
          <DialogDescription>
            Slide {current + 1} sur {slides.length}
          </DialogDescription>
        </DialogHeader>

        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {slides.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="space-y-4 px-6 py-5">
                  <h3 className="text-base font-medium">{slide.title}</h3>
                  {slide.alert ? (
                    <Alert>
                      <AlertTitle>Statut zone</AlertTitle>
                      <AlertDescription>
                        <FaqRichText text={slide.alert} />
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  <div className="text-sm leading-relaxed text-muted-foreground">
                    <FaqRichText text={slide.body} />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="flex items-center justify-between border-t border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <CarouselPrevious type="button" variant="outline" />
              <CarouselNext type="button" variant="outline" />
            </div>
            {isLastSlide ? (
              <Button type="button" onClick={handleActivate}>
                Activer {selectedOfferLabel}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => api?.scrollNext()}>
                Continuer
              </Button>
            )}
          </div>
        </Carousel>
      </DialogContent>
    </Dialog>
  );
}
