"use client";

import { useMemo } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  STAGE_CARDS,
  globalCardIndex,
  type CardSection,
  type StageCard,
} from "../scenes/card-deck";
import { SceneShell } from "./SceneShell";
import { SilverHerculeMark } from "./SilverHerculeMark";
import { StageCardDeck, type StageCardDeckItem } from "./StageCardDeck";

const TIMELINE_NODE_COUNT = 3;

const TIMELINE_FILLED: Record<string, number> = {
  "s10-minutes": 1,
  "s10-month": 2,
  "s10-zoom": 3,
};

function TimelineTrack({ filled }: { filled: number }) {
  return (
    <div className="flex w-full max-w-[14rem] items-center" aria-hidden>
      {Array.from({ length: TIMELINE_NODE_COUNT }, (_, index) => {
        const active = index < filled;
        return (
          <div key={index} className="flex flex-1 items-center last:flex-none">
            <span
              className={cn(
                "size-2.5 shrink-0 rounded-full border",
                active
                  ? "border-zinc-300 bg-zinc-300"
                  : "border-zinc-600 bg-transparent",
              )}
            />
            {index < TIMELINE_NODE_COUNT - 1 ? (
              <span
                className={cn(
                  "h-px w-full",
                  index < filled - 1 ? "bg-zinc-400" : "bg-zinc-700",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CardFace({ card }: { card: StageCard }) {
  if (card.visual === "dual-mark") {
    return (
      <CardHeader className="items-center gap-5 px-6 pt-2 pb-0">
        <div className="flex items-center gap-10">
          {(["DEC", "Courtage"] as const).map((edition) => (
            <div key={edition} className="flex flex-col items-center gap-2">
              <SilverHerculeMark className="size-10" />
              <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
                {edition}
              </p>
            </div>
          ))}
        </div>
        {card.kicker ? (
          <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
            {card.kicker}
          </p>
        ) : null}
        {card.title ? (
          <CardTitle className="text-center text-base font-light tracking-wide text-zinc-300">
            {card.title}
          </CardTitle>
        ) : null}
        {card.body ? (
          <p className="text-center text-sm text-zinc-500">{card.body}</p>
        ) : null}
      </CardHeader>
    );
  }

  if (card.visual === "timeline") {
    const filled = TIMELINE_FILLED[card.id] ?? 1;
    return (
      <CardContent className="flex h-full flex-col items-center justify-center gap-4 py-4 text-center">
        <TimelineTrack filled={filled} />
        {card.kicker ? (
          <p className="text-[10px] tracking-[0.22em] text-zinc-600 uppercase">
            {card.kicker}
          </p>
        ) : null}
        {card.title ? (
          <p
            className={cn(
              "font-light tracking-tight text-zinc-300",
              card.id === "s10-zoom"
                ? "text-3xl tabular-nums"
                : "max-w-xs text-lg tracking-wide",
            )}
          >
            {card.title}
          </p>
        ) : null}
        {card.body ? (
          <p
            className={cn(
              "text-zinc-500",
              card.id === "s10-zoom"
                ? "text-xs tracking-[0.16em] uppercase"
                : "max-w-xs text-sm",
            )}
          >
            {card.body}
          </p>
        ) : null}
      </CardContent>
    );
  }

  return (
    <CardContent className="flex flex-col items-center justify-center gap-3 py-4 text-center">
      {card.kicker ? (
        <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          {card.kicker}
        </p>
      ) : null}
      {card.title ? (
        <p className="max-w-xs text-lg font-light tracking-wide text-zinc-300">
          {card.title}
        </p>
      ) : null}
      {card.body ? (
        <p className="max-w-xs text-sm text-zinc-500">{card.body}</p>
      ) : null}
    </CardContent>
  );
}

type StageCardCarouselProps = {
  section: CardSection;
  step: number;
};

/**
 * Shared 3D card deck for S10 and S12. Index is global across sections so
 * Space advances rotate horizontally around a vertical axis without remount.
 */
export function StageCardCarousel({ section, step }: StageCardCarouselProps) {
  const activeIndex = globalCardIndex(section, step);

  const items = useMemo<StageCardDeckItem[]>(
    () =>
      STAGE_CARDS.map((card) => ({
        id: card.id,
        node: <CardFace card={card} />,
      })),
    [],
  );

  return (
    <SceneShell className="min-w-[28rem]">
      <StageCardDeck
        items={items}
        activeIndex={activeIndex}
        frameClassName="h-[16rem] w-[28rem]"
        cardClassName="h-[14rem] w-[22rem]"
      />
    </SceneShell>
  );
}
