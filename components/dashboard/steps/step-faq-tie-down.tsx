"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { FaqRichText } from "@/components/dashboard/faq-rich-text";
import type { DashboardBleedContext } from "@/lib/dashboard/bleed-context";
import {
  CLOSING_FIT_MIN_WHY_LENGTH,
  getClosingFitOptions,
  getOnboardingFaq,
  type ClosingFitLevel,
} from "@/lib/dashboard/onboarding-faq";
import type { DashboardFaqAudience } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";

type StepFaqTieDownProps = {
  audience?: DashboardFaqAudience;
  bleedContext?: DashboardBleedContext;
  tieDownAccepted: boolean;
  onTieDownChange: (accepted: boolean) => void;
  tieDownId?: string;
  closingFit?: ClosingFitLevel | null;
  onClosingFitChange?: (fit: ClosingFitLevel) => void;
  fitWhy?: string;
  onFitWhyChange?: (why: string) => void;
};

function isCabinetAudience(audience: DashboardFaqAudience): boolean {
  return audience === "comptable" || audience === "cif";
}

export function StepFaqTieDown({
  audience = "agence",
  bleedContext,
  tieDownAccepted,
  onTieDownChange,
  tieDownId = "tie-down-intention",
  closingFit = null,
  onClosingFitChange,
  fitWhy = "",
  onFitWhyChange,
}: StepFaqTieDownProps) {
  const config = getOnboardingFaq(audience, bleedContext);
  const cabinetMode = isCabinetAudience(audience);
  const fitOptions = getClosingFitOptions();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-lg font-medium">Questions fréquentes</h2>
        <p className="mt-1 text-sm text-muted-foreground">{config.subtitle}</p>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {config.items.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger className="text-sm">{item.q}</AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground">
              <FaqRichText text={item.a} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {cabinetMode ? (
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4">
          <div>
            <h3 className="text-sm font-medium">
              Comment vous situez-vous par rapport à ce fonctionnement ?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Votre retour nous aide à adapter la suite — la grille tarifaire reste accessible
              dans tous les cas.
            </p>
          </div>

          <RadioGroup
            value={closingFit ?? undefined}
            onValueChange={(value) => onClosingFitChange?.(value as ClosingFitLevel)}
            className="flex flex-col gap-3"
          >
            {fitOptions.map((option) => (
              <div
                key={option.level}
                className={cn(
                  "flex items-start gap-3 rounded-lg border border-border p-3 transition-colors",
                  closingFit === option.level ? "bg-background ring-1 ring-border" : "bg-card",
                )}
              >
                <RadioGroupItem
                  value={option.level}
                  id={`fit-${option.level}`}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <Label
                    htmlFor={`fit-${option.level}`}
                    className="cursor-pointer text-sm font-medium leading-snug"
                  >
                    {option.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{option.hint}</p>
                </div>
              </div>
            ))}
          </RadioGroup>

          {closingFit ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="fit-why">Qu&apos;est-ce qui vous amène à ce ressenti ?</Label>
              <Textarea
                id="fit-why"
                value={fitWhy}
                onChange={(event) => onFitWhyChange?.(event.target.value)}
                placeholder="Parce que… ou : ce qui compte pour moi, c'est…"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {fitWhy.trim().length}/{CLOSING_FIT_MIN_WHY_LENGTH} caractères minimum
              </p>
            </div>
          ) : null}

          <div className="flex items-start gap-3 border-t border-border pt-4">
            <Checkbox
              id={tieDownId}
              checked={tieDownAccepted}
              onCheckedChange={(checked) => onTieDownChange(checked === true)}
              className="mt-0.5 size-5 border-2 border-foreground/40 bg-background shadow-sm"
            />
            <Label
              htmlFor={tieDownId}
              className="cursor-pointer text-sm leading-snug font-normal"
            >
              <FaqRichText text={config.tieDown} />
            </Label>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id={tieDownId}
              checked={tieDownAccepted}
              onCheckedChange={(checked) => onTieDownChange(checked === true)}
              className="mt-0.5 size-5 border-2 border-foreground/40 bg-background shadow-sm"
            />
            <Label
              htmlFor={tieDownId}
              className="cursor-pointer text-sm leading-snug font-normal"
            >
              <FaqRichText text={config.tieDown} />
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}
