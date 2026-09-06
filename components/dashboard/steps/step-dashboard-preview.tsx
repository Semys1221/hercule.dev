"use client";

import { motion } from "framer-motion";
import { BarChart3, Calendar, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MOCK_TIMELINE = [
  { id: "confirmed", label: "Commande confirmée", status: "done" },
  { id: "onboarding", label: "Onboarding", status: "active" },
  { id: "preparation", label: "Première livraison", status: "pending" },
  { id: "delivery", label: "Premier RDV attribué", status: "pending" },
];

export function StepDashboardPreview() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-medium">Votre tableau de bord</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Une fois payé, vous accèderez à votre espace de suivi en temps réel.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: BarChart3, label: "Demandes en cours", value: "3–4 / mois" },
          { icon: Calendar, label: "Premier RDV", value: "≤ 21 jours" },
          { icon: CheckCircle2, label: "Taux de livraison", value: "100%" },
        ].map(({ icon: Icon, label, value }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader className="pb-2 pt-4">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="size-4 shrink-0" />
                  {label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-lg font-semibold">{value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Progression de livraison
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex flex-wrap gap-2">
            {MOCK_TIMELINE.map((step) => (
              <Badge
                key={step.id}
                variant="outline"
                className={
                  step.status === "done"
                    ? "border-emerald-500/35 text-emerald-400"
                    : step.status === "active"
                      ? "border-primary text-foreground"
                      : "text-muted-foreground"
                }
              >
                {step.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Aperçu — votre tableau de bord sera activé après paiement et onboarding.
      </p>
    </div>
  );
}
