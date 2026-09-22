"use client";

import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  COURTAGE_OFFER,
  COURTAGE_STEP_COUNT,
  DEC_OFFER,
  type OfferStory,
} from "../scenes/card-deck";
import { Counter } from "./Counter";

const EASE = [0.22, 1, 0.36, 1] as const;
const BAR_MAX_PX = 132;

type OfferPairProps = {
  edition: "DEC" | "Courtage";
  step: number;
};

type Act = 1 | 2 | 3 | 4;

function actFor(story: OfferStory, step: number): { act: Act; local: number } {
  if (step < 4) return { act: 1, local: step };
  if (step < 8) return { act: 2, local: step - 4 };
  const curveBeats = story.curve.kind === "mrr" ? 2 : 1;
  if (step < 8 + curveBeats) return { act: 3, local: step - 8 };
  return { act: 4, local: step - 8 - curveBeats };
}

function ScoreStrip({ story }: { story: OfferStory }) {
  return (
    <Card className="w-72 gap-3 border-zinc-800/60 bg-zinc-950/80 py-4 shadow-none">
      <CardHeader className="px-5">
        <CardTitle className="text-sm font-medium tracking-[0.22em] text-zinc-100 uppercase">
          {story.title}
        </CardTitle>
        <CardDescription className="text-zinc-500">{story.niche}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1 px-5">
        <p className="text-lg font-light tabular-nums tracking-tight text-zinc-100">
          {story.scoreReturn}
        </p>
        <p className="text-xs text-zinc-500">{story.scorePrice}</p>
      </CardContent>
    </Card>
  );
}

function Ribbon({ story, phrase }: { story: OfferStory; phrase: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] tracking-[0.22em] text-zinc-500 uppercase">
        {story.title} · {story.niche}
      </p>
      {phrase ? (
        <p className="text-xs text-zinc-600">{phrase}</p>
      ) : null}
    </div>
  );
}

function CaseAct({ story, local }: { story: OfferStory; local: number }) {
  const beat = story.caseBeats[local];
  if (!beat) return null;
  const previous = local > 0 ? story.caseBeats[local - 1]?.text ?? "" : "";

  return (
    <div className="flex w-[28rem] flex-col gap-6">
      <Ribbon story={story} phrase={local === 0 ? "" : previous} />
      <motion.div
        key={beat.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="flex flex-col gap-4"
      >
        <p className="text-[10px] tracking-[0.2em] text-zinc-600 uppercase">
          {beat.kicker}
        </p>
        {beat.pills ? (
          <div className="flex flex-wrap gap-2">
            {beat.pills.map((pill) => (
              <span
                key={pill}
                className="rounded-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-sm text-zinc-200"
              >
                {pill}
              </span>
            ))}
          </div>
        ) : (
          <p
            className={cn(
              "font-light text-zinc-100",
              local === 0 ? "text-2xl tracking-tight" : "text-lg leading-snug",
            )}
          >
            {beat.text}
          </p>
        )}
      </motion.div>
    </div>
  );
}

function EquationAct({ story, local }: { story: OfferStory; local: number }) {
  const lastCase = story.caseBeats[story.caseBeats.length - 1];
  const terms = story.equation.slice(0, local + 1);
  const resultIndex = story.equation.length - 1;

  return (
    <div className="flex w-[36rem] flex-col gap-8">
      <Ribbon story={story} phrase={lastCase?.pills?.join(" · ") ?? lastCase?.text ?? ""} />
      <div className="flex flex-wrap items-end gap-3">
        {terms.map((term, index) => {
          const isResult = index === resultIndex;
          return (
            <motion.div
              key={term.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex items-end gap-3"
            >
              <div className="flex flex-col gap-1">
                <p className="text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
                  {term.kicker}
                </p>
                <p
                  className={cn(
                    "tabular-nums text-zinc-100",
                    isResult
                      ? "text-2xl font-light tracking-tight"
                      : "text-sm text-zinc-300",
                  )}
                >
                  {term.value}
                </p>
              </div>
              {term.joiner && index < terms.length - 1 ? (
                <span className="mb-0.5 text-sm text-zinc-600">{term.joiner}</span>
              ) : null}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MrrCurve({
  story,
  local,
}: {
  story: OfferStory;
  local: number;
}) {
  if (story.curve.kind !== "mrr") return null;
  const visible = story.curve.columns.slice(0, local === 0 ? 2 : 3);
  const maxWeight = 12;

  return (
    <div className="flex w-[36rem] flex-col gap-8">
      <Ribbon story={story} phrase="1 500 € / mois" />
      <div className="flex items-end gap-8">
        {visible.map((column) => (
          <motion.div
            key={column.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="flex flex-1 flex-col items-center gap-3"
          >
            <p className="text-lg font-light tabular-nums text-zinc-100">
              {column.amount}
            </p>
            <div className="flex h-[132px] w-full items-end justify-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: Math.max(10, (column.weight / maxWeight) * BAR_MAX_PX),
                }}
                transition={{ duration: 0.55, ease: EASE }}
                className="w-12 rounded-sm bg-zinc-300"
              />
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <p className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
                {column.label}
              </p>
              <p className="text-[10px] tracking-[0.16em] text-zinc-600 uppercase">
                {column.caption}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CommissionCurve({ story }: { story: OfferStory }) {
  if (story.curve.kind !== "commission") return null;
  const curve = story.curve;

  return (
    <div className="flex w-[28rem] flex-col gap-6">
      <Ribbon story={story} phrase="13 signatures · 50 %" />
      <div className="flex flex-col gap-2">
        <p className="text-[10px] tracking-[0.18em] text-zinc-600 uppercase">
          {curve.formula}
        </p>
        <p className="text-2xl font-light tabular-nums tracking-tight text-zinc-100">
          <Counter
            from={curve.from}
            to={curve.to}
            duration={1.4}
            format={(v) =>
              `${new Intl.NumberFormat("fr-FR").format(Math.round(v))} €`
            }
          />
        </p>
        <p className="text-xs text-zinc-500">{curve.caption}</p>
      </div>
    </div>
  );
}

function StairContrast({
  story,
  local,
}: {
  story: OfferStory;
  local: number;
}) {
  if (story.contrast.kind !== "stair") return null;
  const { steps, priceAmount, priceLabel } = story.contrast;
  const filled = local === 0 ? 1 : steps.length;
  const maxWeight = steps[steps.length - 1]?.weight ?? 1;

  return (
    <div className="flex w-[38rem] flex-col gap-8">
      <Ribbon story={story} phrase="18 000 € de MRR au 12e mois" />
      <div className="flex items-end gap-10">
        <div className="flex flex-1 items-end gap-4">
          {steps.slice(0, filled).map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="flex flex-1 flex-col items-center gap-3"
            >
              <p className="text-lg font-light tabular-nums text-zinc-100">
                {item.amount}
              </p>
              <div className="flex h-[132px] w-full items-end justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{
                    height: Math.max(12, (item.weight / maxWeight) * BAR_MAX_PX),
                  }}
                  transition={{ duration: 0.55, ease: EASE }}
                  className="w-10 rounded-sm bg-zinc-300"
                />
              </div>
              <p className="text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
        <div className="flex w-28 flex-col items-center gap-3">
          <p className="text-lg font-light tabular-nums text-zinc-100">
            {priceAmount.split(" /")[0]}
          </p>
          <div className="flex h-[132px] w-full items-end justify-center">
            <div
              className="w-10 rounded-sm bg-zinc-600"
              style={{ height: (1 / maxWeight) * BAR_MAX_PX }}
            />
          </div>
          <p className="text-center text-[10px] tracking-[0.18em] text-zinc-500 uppercase">
            {priceLabel}
          </p>
          <p className="text-[10px] text-zinc-600">{priceAmount}</p>
        </div>
      </div>
    </div>
  );
}

function BarContrast({ story }: { story: OfferStory }) {
  if (story.contrast.kind !== "bars") return null;
  const { gain, price } = story.contrast;
  const maxWeight = gain.weight;

  return (
    <div className="flex w-[32rem] flex-col gap-8">
      <Ribbon story={story} phrase={gain.amount} />
      <div className="flex items-end gap-12">
        {(
          [
            { ...gain, fill: "bg-zinc-300" },
            { ...price, fill: "bg-zinc-600" },
          ] as const
        ).map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-3">
            <p className="text-lg font-light tabular-nums text-zinc-100">
              {bar.amount.split(" /")[0]}
            </p>
            <div className="flex h-[132px] w-full items-end justify-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{
                  height: Math.max(10, (bar.weight / maxWeight) * BAR_MAX_PX),
                }}
                transition={{ duration: 0.55, ease: EASE }}
                className={cn("w-14 rounded-sm", bar.fill)}
              />
            </div>
            <p className="text-center text-[10px] tracking-[0.16em] text-zinc-500 uppercase">
              {bar.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OfferStoryBoard({ story, step }: { story: OfferStory; step: number }) {
  const { act, local } = actFor(story, step);

  return (
    <Card className="gap-0 border-zinc-800/60 bg-zinc-950/80 py-6 shadow-none">
      <CardContent className="px-8 py-2">
        <motion.div
          key={`${story.edition}-${act}-${local}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {act === 1 ? <CaseAct story={story} local={local} /> : null}
          {act === 2 ? <EquationAct story={story} local={local} /> : null}
          {act === 3 && story.curve.kind === "mrr" ? (
            <MrrCurve story={story} local={local} />
          ) : null}
          {act === 3 && story.curve.kind === "commission" ? (
            <CommissionCurve story={story} />
          ) : null}
          {act === 4 && story.contrast.kind === "stair" ? (
            <StairContrast story={story} local={local} />
          ) : null}
          {act === 4 && story.contrast.kind === "bars" ? (
            <BarContrast story={story} />
          ) : null}
        </motion.div>
      </CardContent>
    </Card>
  );
}

/** DEC plays four acts. Courtage folds DEC to a score, then folds itself. */
export function OfferPair({ edition, step }: OfferPairProps) {
  if (edition === "DEC") {
    return (
      <div data-stage-bare="" className="flex items-center justify-center">
        <OfferStoryBoard story={DEC_OFFER} step={step} />
      </div>
    );
  }

  const courtageClosed = step >= COURTAGE_STEP_COUNT - 1;

  return (
    <div data-stage-bare="" className="flex items-start gap-4">
      <ScoreStrip story={DEC_OFFER} />
      {courtageClosed ? (
        <ScoreStrip story={COURTAGE_OFFER} />
      ) : (
        <OfferStoryBoard story={COURTAGE_OFFER} step={step} />
      )}
    </div>
  );
}
