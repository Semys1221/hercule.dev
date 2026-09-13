"use client";

import { ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIntentionOptions } from "@/lib/dashboard/onboarding-faq";
import type { DashboardFaqAudience, OnboardingIntentionLevel } from "@/lib/dashboard/types";

type StepIntentionWindowProps = {
  audience: DashboardFaqAudience;
  onSelect: (level: OnboardingIntentionLevel) => void;
};

export function StepIntentionWindow({
  audience,
  onSelect,
}: StepIntentionWindowProps) {
  const options = getIntentionOptions(audience);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-medium">Votre intention</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Toutes les options ouvrent la grille tarifaire — choisissez le ton qui correspond à
          votre niveau de décision.
        </p>
      </div>

      <div className="grid gap-3">
        {options.map((option) => (
          <Card key={option.level} className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{option.label}</CardTitle>
              <CardDescription>{option.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant={option.level === "strong" ? "default" : "outline"}
                className="w-full justify-between"
                onClick={() => onSelect(option.level)}
              >
                Continuer
                <ChevronRight className="size-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
