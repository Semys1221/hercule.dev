"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SceneLabel } from "../shared/SceneLabel";
import { StageCardDeck } from "../shared/StageCardDeck";
import {
  qualificationView,
  type NicheCardView,
  type Speaker,
} from "./s09-qualification";

const EASE = [0.22, 1, 0.36, 1] as const;

function HighlightedText({
  text,
  highlights,
}: {
  text: string;
  highlights?: string[];
}) {
  if (!highlights?.length) return text;

  const escaped = highlights
    .filter(Boolean)
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!escaped.length) return text;

  const pattern = new RegExp(`(${escaped.join("|")})`, "g");
  const parts = text.split(pattern);

  return parts.map((part, index) =>
    highlights.includes(part) ? (
      <span
        key={`${part}-${index}`}
        className="rounded-sm bg-zinc-800 px-0.5 text-zinc-50"
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function DialogueBubble({
  speaker,
  text,
  highlights,
}: {
  speaker: Speaker;
  text: string;
  highlights?: string[];
}) {
  const isHercule = speaker === "hercule";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={cn("flex w-full flex-col gap-1", isHercule ? "items-start" : "items-end")}
    >
      <p
        className={cn(
          "text-[10px] tracking-[0.18em] uppercase",
          isHercule ? "text-zinc-600" : "text-zinc-500",
        )}
      >
        {isHercule ? "Hercule" : "Client"}
      </p>
      <p
        className={cn(
          "max-w-[92%] text-sm leading-snug",
          isHercule ? "text-left text-zinc-400" : "text-right text-zinc-100",
        )}
      >
        <HighlightedText text={text} highlights={highlights} />
      </p>
    </motion.div>
  );
}

function VerdictStamp({
  label,
  highlights,
  stamp,
}: {
  label: string;
  highlights: string[];
  stamp: string | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="border-t border-zinc-800 pt-3"
    >
      <p className="text-xs leading-snug tracking-[0.02em] text-zinc-200">
        <HighlightedText text={label} highlights={highlights} />
      </p>
      {stamp ? (
        <div className="mt-3 flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-4 shrink-0 items-center justify-center border border-zinc-400 text-[11px] leading-none text-zinc-100"
          >
            ✓
          </span>
          <span className="text-sm tracking-[0.02em] text-zinc-200">{stamp}</span>
        </div>
      ) : null}
    </motion.div>
  );
}

function NicheFace({ card, active }: { card: NicheCardView; active: boolean }) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [active, card.lines.length, card.verdict]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CardHeader className={cn("shrink-0 px-6 pt-0 pb-0", card.dimmed && "opacity-40")}>
        <CardTitle className="p-0">
          <SceneLabel size="lg" animate={false}>
            {card.niche}
          </SceneLabel>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col px-6 pt-4">
        <div ref={scrollerRef} data-qual-scroller className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          <div className={cn("flex flex-col gap-4", card.dimmed && "opacity-40")}>
            {card.lines.map((line, index) => (
              <DialogueBubble
                key={`${card.niche}-${index}`}
                speaker={line.speaker}
                text={line.text}
                highlights={line.highlights}
              />
            ))}
          </div>
          {card.verdict ? (
            <VerdictStamp
              label={card.verdict}
              highlights={card.verdictHighlights}
              stamp={card.stamp}
            />
          ) : null}
        </div>
      </CardContent>
    </div>
  );
}

export function QualificationBoard({ step }: { step: number }) {
  const view = qualificationView(step);

  if (!view) return null;

  const items = view.cards.map((card, index) => ({
    id: card.niche,
    dimmed: card.dimmed,
    node: <NicheFace card={card} active={index === view.activeIndex} />,
  }));

  return (
    <div className="flex max-h-full flex-col items-center gap-4">
      <StageCardDeck
        items={items}
        activeIndex={view.activeIndex}
        solo
        flat
        frameClassName="h-[min(30rem,calc(100dvh-22rem))] w-[28rem] overflow-hidden"
        cardClassName="flex h-full min-h-0 w-[22rem] flex-col overflow-hidden py-4"
      />
    </div>
  );
}
