"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FAKE_SEAT_CAPACITY } from "@/lib/conference/sale-window";
import type { SceneProps } from "../presentation/types";
import { PaymentTrustBadges } from "../shared/PaymentTrustBadges";
import { SceneShell } from "../shared/SceneShell";

const EASE = [0.22, 1, 0.36, 1] as const;

const SALE_WINDOW_MINUTES = 5;

type InscriptionBeat = {
  kicker: string;
  title: string;
  body?: string;
  badges?: boolean;
};

const INSCRIPTION_BEATS: InscriptionBeat[] = [
  {
    kicker: "Paiement",
    title: "Le lien Stripe sera dans le chat",
    badges: true,
  },
  {
    kicker: "Places",
    title: `${FAKE_SEAT_CAPACITY} places par accompagnement`,
  },
  {
    kicker: "Fenêtre",
    title: `${SALE_WINDOW_MINUTES} minutes`,
    body: "Pour s’inscrire après l’ouverture.",
  },
];

/**
 * S16 — Inscription  (steps 0-2)
 *
 * Une carte, une ligne nouvelle par beat.
 */
export function S16_Urgency({ step }: SceneProps) {
  const revealed = INSCRIPTION_BEATS.slice(0, step + 1);

  return (
    <SceneShell>
      <Card
        data-stage-bare
        className="w-[min(36rem,calc(100vw-5rem))] gap-5 overflow-hidden border-border bg-card/70 py-6 shadow-none"
      >
        <CardHeader className="px-6">
          <CardTitle className="text-center text-sm font-medium tracking-[0.22em] text-foreground uppercase">
            Inscription
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Modalités, dans l’ordre
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 px-6">
          {revealed.map((row, index) => (
            <motion.div
              key={row.kicker}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-col items-center gap-3 text-center"
            >
              {index > 0 ? <div className="h-px w-16 bg-muted" /> : null}
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                {row.kicker}
              </p>
              <p className="text-lg font-light tracking-wide text-foreground">
                {row.title}
              </p>
              {row.body ? (
                <p className="text-xs text-muted-foreground">{row.body}</p>
              ) : null}
              {row.badges ? <PaymentTrustBadges /> : null}
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </SceneShell>
  );
}
