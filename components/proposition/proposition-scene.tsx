"use client";

import { useCallback, useState } from "react";

import { HerculeMark } from "@/components/hercule-mark";
import { PropositionWizard } from "@/components/proposition/proposition-wizard";
import { ProspectGate } from "@/components/proposition/prospect-gate";
import { getProposition, listPropositions } from "@/lib/propositions/registry";
import type { PropositionConfig } from "@/lib/propositions/schema";

const PROSPECTS = listPropositions();

export function PropositionScene() {
  const [activeConfig, setActiveConfig] = useState<PropositionConfig | null>(null);

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
        <header className="flex flex-col items-center gap-3 pt-2">
          <HerculeMark className="size-10 text-zinc-50" />
          <p className="text-lg font-semibold tracking-tight text-zinc-50">Hercule</p>
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
