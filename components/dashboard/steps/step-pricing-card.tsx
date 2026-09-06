"use client";

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FEATURES = [
  "3–4 RDV qualifiés honorés / mois",
  "Prospect décideur, visio ≥ 15 min",
  "0 % de commission sur vos ventes",
  "Remplacement garanti si no-show",
  "Activation en moins de 48h après onboarding",
];

type StepPricingCardProps = {
  onProceed: () => void;
};

export function StepPricingCard({ onProceed }: StepPricingCardProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Votre accès Hercule</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Une seule formule, sans engagement caché.
        </p>
      </div>

      <Card className="border-primary/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-semibold">
            1 489 <span className="text-base font-normal text-muted-foreground">€ TTC / mois</span>
          </CardTitle>
          <CardDescription>Sans engagement · Résiliation avec préavis 30 jours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button type="button" className="w-full" onClick={onProceed}>
            Procéder au paiement
          </Button>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-muted-foreground">
        Paiement sécurisé · Facture émise automatiquement
      </p>
    </div>
  );
}
