"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PipelineDashboardMetrics } from "@/lib/calendly/pipeline-dashboard";
import { cn } from "@/lib/utils";

import { AgenceReventePitchBusinessModel } from "./agence-revente-pitch-business-model";
import {
  formatPitchWelcomeName,
  getVisibleProduitBlocks,
  produitBlockKey,
  type ProduitRevealBlock,
} from "./agence-revente-pitch-steps";
import { AgenceReventeSegmentBars } from "./agence-revente-segment-bars";

type AgenceReventePitchProduitProps = {
  metrics: PipelineDashboardMetrics;
  companyName: string;
  revealIndex: number;
  latestBlockIndex: number;
};

function AccrocheBlock({
  companyName,
  animate,
}: {
  companyName: string;
  animate: boolean;
}) {
  const welcomeName = formatPitchWelcomeName(companyName);
  const welcomeLine = welcomeName
    ? `Bienvenue, ${welcomeName} — pipeline Hercule Libéral pour cabinets comptables et conseillers financiers, créneaux visio 30 min déjà bookés.`
    : "Bienvenue, — pipeline Hercule Libéral pour cabinets comptables et conseillers financiers, créneaux visio 30 min déjà bookés.";

  return (
    <div
      className={cn(
        "space-y-3",
        animate && "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500",
      )}
    >
      <Badge variant="secondary">1 acheteur retenu</Badge>
      <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
        Un flux continu de RDV qualifiés, déjà planifiés.
      </h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{welcomeLine}</p>
    </div>
  );
}

function BarsBlock({
  block,
  animate,
}: {
  block: Extract<ProduitRevealBlock, { type: "kpi_bars" | "segment_bars" }>;
  animate: boolean;
}) {
  return (
    <Card
      className={
        animate ? "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500" : undefined
      }
    >
      <CardContent className="pt-6">
        <AgenceReventeSegmentBars
          headline={block.headline}
          subtitle={block.subtitle}
          rows={block.rows.map((row, rowIndex) => ({
            ...row,
            animate: animate && rowIndex === block.rows.length - 1,
          }))}
        />
      </CardContent>
    </Card>
  );
}

function renderProduitBlock(
  block: ProduitRevealBlock,
  companyName: string,
  animate: boolean,
) {
  if (block.type === "business_model_intro") {
    return <AgenceReventePitchBusinessModel mode="intro" animate={animate} />;
  }

  if (block.type === "business_model_step") {
    return (
      <AgenceReventePitchBusinessModel
        mode="step"
        stepIndex={block.stepIndex}
        animate={animate}
      />
    );
  }

  if (block.type === "accroche") {
    return <AccrocheBlock companyName={companyName} animate={animate} />;
  }

  if (block.type === "kpi_bars" || block.type === "segment_bars") {
    return <BarsBlock block={block} animate={animate} />;
  }

  if (block.type === "purchase_header") {
    return (
      <Card className={animate ? "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500" : undefined}>
        <CardHeader>
          <CardTitle>Ce que vous achetez</CardTitle>
          <CardDescription>Un accès pipeline, déjà testé et planifié.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (block.type === "purchase_bullet") {
    return (
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm",
          animate && "animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-500",
        )}
      >
        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
        <span>{block.bullet}</span>
      </div>
    );
  }

  return null;
}

export function AgenceReventePitchProduit({
  metrics,
  companyName,
  revealIndex,
  latestBlockIndex,
}: AgenceReventePitchProduitProps) {
  const latestBlockRef = useRef<HTMLDivElement>(null);
  const blocks = getVisibleProduitBlocks(metrics, revealIndex);
  const animate = revealIndex === latestBlockIndex;

  useEffect(() => {
    if (latestBlockIndex < 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      latestBlockRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [latestBlockIndex, revealIndex]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 pb-4">
      {blocks.map((block, index) => {
        const isLatest = index === blocks.length - 1;
        const blockAnimate = isLatest && animate;

        return (
          <div
            key={produitBlockKey(block, index)}
            ref={isLatest ? latestBlockRef : undefined}
            className={isLatest ? "scroll-mt-6" : undefined}
          >
            {renderProduitBlock(block, companyName, blockAnimate)}
          </div>
        );
      })}
    </div>
  );
}
