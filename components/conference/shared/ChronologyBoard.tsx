"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  STAGE_CARDS,
  globalCardIndex,
  type CardSection,
  type StageCard,
} from "../scenes/card-deck";
import { SceneShell } from "./SceneShell";
import { GlassHerculeMark } from "./GlassHerculeMark";

const EASE = [0.22, 1, 0.36, 1] as const;

function ChronologyTrack({ filled, total }: { filled: number; total: number }) {
  return (
    <div className="flex w-full items-center" aria-hidden>
      {Array.from({ length: total }, (_, index) => {
        const active = index < filled;
        return (
          <div key={index} className="flex flex-1 items-center last:flex-none">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full border",
                active
                  ? "border-foreground bg-foreground"
                  : "border-border bg-transparent",
              )}
            />
            {index < total - 1 ? (
              <span
                className={cn(
                  "h-px w-full",
                  index < filled - 1 ? "bg-foreground/60" : "bg-foreground/20",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function LegendRow({ card, animate }: { card: StageCard; animate: boolean }) {
  const body = (
    <div className="flex flex-col gap-1 text-center">
      {card.visual === "dual-mark" ? (
        <div className="flex items-center justify-center gap-6">
          {(["DEC", "Courtage"] as const).map((edition) => (
            <div key={edition} className="flex flex-col items-center gap-1">
              <GlassHerculeMark className="size-6" />
              <p className="text-[9px] tracking-[0.18em] text-muted-foreground uppercase">
                {edition}
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {card.kicker ? (
        <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          {card.kicker}
        </p>
      ) : null}
      {card.title ? (
        <p
          className={cn(
            "font-light text-foreground",
            card.id === "s10-zoom"
              ? "text-2xl tabular-nums tracking-tight"
              : "text-sm tracking-wide",
          )}
        >
          {card.title}
        </p>
      ) : null}
      {card.body ? (
        <p className="text-xs text-muted-foreground">{card.body}</p>
      ) : null}
    </div>
  );

  if (!animate) return body;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {body}
    </motion.div>
  );
}

type ChronologyBoardProps = {
  section: CardSection;
  step: number;
};

/** S10 screen: one bar, captions accumulate with each beat. */
export function ChronologyBoard({ section, step }: ChronologyBoardProps) {
  const activeIndex = globalCardIndex(section, step);
  const revealed = STAGE_CARDS.slice(0, activeIndex + 1);

  return (
    <SceneShell>
      <Card
        data-stage-bare
        className="w-[min(40rem,calc(100vw-5rem))] gap-5 overflow-hidden border-border bg-card/70 py-6 shadow-none"
      >
        <CardContent className="flex max-h-[min(28rem,calc(100dvh-22rem))] flex-col gap-6 overflow-hidden px-6">
          <ChronologyTrack filled={revealed.length} total={STAGE_CARDS.length} />
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto">
            {revealed.map((card, index) => (
              <LegendRow
                key={card.id}
                card={card}
                animate={index === revealed.length - 1}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </SceneShell>
  );
}
