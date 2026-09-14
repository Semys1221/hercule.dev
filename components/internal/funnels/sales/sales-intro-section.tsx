"use client";

import { Check, Clock } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { resolveClientSegment } from "@/lib/admin/funnels/client-segment";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import type { Audience } from "@/lib/admin/navigation";
import { RESERVATION_SURFACE } from "@/lib/admin/funnels/reservation-surface";
import type { SalesQualificationValues } from "@/lib/admin/funnels/sales-qualification-schema";
import { cn } from "@/lib/utils";

import { SalesConfirmationCard } from "./sales-confirmation-card";
import { getIntroConfirmationText, type SalesFunnelSection } from "./sales-funnel-sections";

const INTRO_BENEFITS = [
  "Des opportunités compatibles avec vos expertises et vos tarifs",
  "Moins de temps perdu sur des dossiers hors-profil",
  "Un scoring de compatibilité ajusté à votre capacité réelle",
  "Une relation durable fondée sur la transparence mutuelle",
] as const;

const CABINET_INTRO_CADRAGE_ITEMS = [
  {
    title: "Téléphones en silencieux",
    body:
      "Merci de couper les notifications et de mettre vos appareils en silencieux pour rester pleinement concentrés sur cet échange.",
  },
  {
    title: "Transparence, sans compétition",
    body:
      "Nous partageons nos méthodes et nos limites en toute franchise. Pas de posture commerciale agressive : l'enjeu est un dialogue honnête, pas un face-à-face.",
  },
  {
    title: "Objectif de cette session",
    body:
      "Déterminer ensemble si le système Hercule peut vous apporter une valeur concrète — et dans quelles conditions un partenariat aurait du sens.",
  },
] as const;

type SalesIntroSectionProps = {
  audience: Audience;
  section: SalesFunnelSection;
  form: UseFormReturn<SalesQualificationValues>;
};

export function SalesIntroSection({ audience, section, form }: SalesIntroSectionProps) {
  const watchedQ11 = useWatch({ control: form.control, name: "q11" }) as string[] | undefined;
  const clientSegment = resolveClientSegment(watchedQ11 ?? []);
  // #region agent log
  fetch('http://127.0.0.1:7849/ingest/172cb84e-a8e1-4d83-b273-2b61310f5e7d',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'fbe33c'},body:JSON.stringify({sessionId:'fbe33c',location:'sales-intro-section.tsx:render',message:'SalesIntroSection render',data:{audience,clientSegment,q11Type:Array.isArray(watchedQ11)?'array':typeof watchedQ11},timestamp:Date.now(),hypothesisId:'B',runId:'pre-fix'})}).catch(()=>{});
  // #endregion
  const isCabinet = isCabinetBuyerSalesAudience(audience);
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 text-left">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold tracking-tight">{section.title}</h1>
          {section.duration ? (
            <Badge variant="outline" className="gap-1 font-normal text-muted-foreground">
              <Clock className="size-3" aria-hidden />
              {section.duration}
            </Badge>
          ) : null}
        </div>
        {section.subtitle ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{section.subtitle}</p>
        ) : null}
      </div>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-foreground">
          {isCabinet ? "Cadre de l'échange" : "Pourquoi cet audit"}
        </h2>
        <Card className={cn(RESERVATION_SURFACE, "shadow-none")}>
          <CardContent className="divide-y divide-border p-0">
            {isCabinet
              ? CABINET_INTRO_CADRAGE_ITEMS.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 px-5 py-4 md:px-6 md:py-5"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted"
                      aria-hidden
                    >
                      <Check className="size-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">{item.title}</p>
                      <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                    </div>
                  </div>
                ))
              : INTRO_BENEFITS.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 px-5 py-4 md:px-6 md:py-5"
                  >
                    <div
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted"
                      aria-hidden
                    >
                      <Check className="size-4 text-primary" />
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{benefit}</p>
                  </div>
                ))}
          </CardContent>
        </Card>
      </section>

      <FormField
        control={form.control}
        name="introConfirmed"
        render={({ field }) => (
          <FormItem>
            <SalesConfirmationCard
              id="sales-intro-confirmed"
              label={getIntroConfirmationText(audience, clientSegment)}
              description="Cette étape est requise avant de commencer la qualification."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
