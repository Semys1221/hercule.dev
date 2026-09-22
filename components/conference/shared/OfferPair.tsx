"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  COURTAGE_OFFER_LINES,
  DEC_OFFER_LINES,
  type OfferLine,
} from "../scenes/card-deck";

const EASE = [0.22, 1, 0.36, 1] as const;

function OfferLineRow({ line, animate }: { line: OfferLine; animate: boolean }) {
  const body = (
    <p className="text-sm leading-snug text-zinc-200">
      <span className="text-zinc-500">{line.theme} : </span>
      {line.text}
    </p>
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

function OfferCard({ title, lines }: { title: string; lines: OfferLine[] }) {
  return (
    <Card className="w-80 gap-4 border-zinc-800/60 bg-zinc-950/80 py-5 shadow-none">
      <CardHeader className="px-5">
        <CardTitle className="text-sm font-medium tracking-[0.22em] text-zinc-100 uppercase">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 px-5">
        {lines.map((line, index) => (
          <OfferLineRow
            key={line.id}
            line={line}
            animate={index === lines.length - 1}
          />
        ))}
      </CardContent>
    </Card>
  );
}

type OfferPairProps = {
  edition: "DEC" | "Courtage";
  step: number;
};

/** DEC fills line by line. Courtage appears beside it and fills the same way. */
export function OfferPair({ edition, step }: OfferPairProps) {
  const decLines =
    edition === "DEC" ? DEC_OFFER_LINES.slice(0, step + 1) : DEC_OFFER_LINES;
  const courtageLines =
    edition === "Courtage" ? COURTAGE_OFFER_LINES.slice(0, step + 1) : [];

  return (
    <div data-stage-bare="" className="flex items-start gap-4">
      <OfferCard title="DEC" lines={decLines} />
      {courtageLines.length > 0 ? (
        <OfferCard title="Courtage" lines={courtageLines} />
      ) : null}
    </div>
  );
}
