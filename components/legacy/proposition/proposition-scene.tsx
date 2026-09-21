"use client";

import { useCallback, useState } from "react";

import { HerculeMark } from "@/components/hercule-mark";
import { PropositionWizard } from "@/components/legacy/proposition/proposition-wizard";
import { ProspectGate } from "@/components/legacy/proposition/prospect-gate";
import { getProposition, listPropositions } from "@/lib/legacy/propositions/registry";
import type { PropositionConfig } from "@/lib/legacy/propositions/schema";

const PROSPECTS = listPropositions();

type PropositionSceneProps = {
  slug?: string;
};

export function PropositionScene({ slug }: PropositionSceneProps) {
  const [activeConfig, setActiveConfig] = useState<PropositionConfig | null>(() =>
    slug ? getProposition(slug) : null,
  );

  const handleStart = useCallback((slug: string) => {
    const config = getProposition(slug);
    if (config) {
      setActiveConfig(config);
    }
  }, []);

  return (
    <div
      className="relative min-h-screen overflow-hidden text-zinc-100"
      style={{ backgroundColor: "#09090B" }}
    >
      <div
        className="pointer-events-none absolute"
        style={{
          top: "20%",
          left: "50%",
          transform: "translate(-50%, -30%)",
          width: "900px",
          height: "600px",
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.08) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        <header className="flex flex-col items-center gap-3 pt-2 text-center">
          <HerculeMark className="size-10 text-zinc-50" />
          {activeConfig?.pageTitle ? (
            <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
              {activeConfig.pageTitle}
            </h1>
          ) : (
            <p className="text-lg font-semibold tracking-tight text-zinc-50">Hercule</p>
          )}
        </header>

        <main className="flex flex-1 flex-col items-center justify-center py-12">
          {activeConfig ? (
            <PropositionWizard config={activeConfig} />
          ) : (
            <ProspectGate prospects={PROSPECTS} onStart={handleStart} />
          )}
        </main>
      </div>
    </div>
  );
}
