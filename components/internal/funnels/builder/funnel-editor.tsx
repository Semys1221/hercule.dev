"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FunnelList } from "@/components/internal/funnels/builder/funnel-list";
import { LayoutPicker } from "@/components/internal/funnels/builder/layout-picker";
import { StepEditor } from "@/components/internal/funnels/builder/step-editor";
import { StepsMapper } from "@/components/internal/funnels/builder/steps-mapper";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import type { FunnelCatalog } from "@/lib/admin/funnels/catalog";
import { funnelEditorHref, funnelListHref } from "@/lib/admin/funnels/routing";
import type { FunnelDocument, FunnelScope } from "@/lib/admin/funnels/schema";

type FunnelBuilderListProps = {
  scope: FunnelScope;
  navPath: string[];
  title: string;
};

export function FunnelBuilderList(props: FunnelBuilderListProps) {
  return <FunnelList {...props} />;
}

type FunnelEditorProps = {
  scope: FunnelScope;
  navPath: string[];
  funnelSlug: string;
};

type WizardPhase = "layout" | "map" | "step";

export function FunnelEditor({ scope, navPath, funnelSlug }: FunnelEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phase = (searchParams.get("phase") as WizardPhase | null) ?? "layout";
  const stepId = searchParams.get("stepId");

  const [funnel, setFunnel] = useState<FunnelDocument | null>(null);
  const [catalog, setCatalog] = useState<FunnelCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [funnelResponse, catalogResponse] = await Promise.all([
        fetch(funnelApiUrl(`/${funnelSlug}`, scope)),
        fetch("/api/admin/funnels/catalog"),
      ]);
      const funnelBody = (await funnelResponse.json()) as {
        funnel?: FunnelDocument;
        error?: string;
      };
      const catalogBody = (await catalogResponse.json()) as {
        catalog?: FunnelCatalog;
        error?: string;
      };
      if (!funnelResponse.ok) {
        throw new Error(funnelBody.error ?? "Funnel introuvable");
      }
      if (!catalogResponse.ok) {
        throw new Error(catalogBody.error ?? "Catalogue introuvable");
      }
      setFunnel(funnelBody.funnel ?? null);
      setCatalog(catalogBody.catalog ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [funnelSlug, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const activeStep = useMemo(() => {
    if (!funnel || funnel.steps.length === 0) {
      return null;
    }
    return funnel.steps.find((step) => step.id === stepId) ?? funnel.steps[0];
  }, [funnel, stepId]);

  function goTo(nextPhase: WizardPhase, nextStepId?: string) {
    const query: Record<string, string> = { phase: nextPhase };
    if (nextStepId) {
      query.stepId = nextStepId;
    }
    router.push(funnelEditorHref(navPath, funnelSlug, query));
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement du funnel…</p>;
  }

  if (error || !funnel || !catalog) {
    return <p className="text-sm text-destructive">{error ?? "Funnel introuvable"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{funnel.displayName}</h2>
          <p className="text-sm text-muted-foreground">
            {funnel.slug} · {funnel.status} · {funnel.publicPath}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={funnelListHref(navPath)}>Retour à la liste</Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={phase === "layout" ? "default" : "outline"}
          onClick={() => goTo("layout")}
        >
          Layout
        </Button>
        <Button
          size="sm"
          variant={phase === "map" ? "default" : "outline"}
          onClick={() => goTo("map")}
        >
          Étapes
        </Button>
        <Button
          size="sm"
          variant={phase === "step" ? "default" : "outline"}
          disabled={funnel.steps.length === 0}
          onClick={() => goTo("step", activeStep?.id)}
        >
          Contenu
        </Button>
      </div>

      {phase === "layout" ? (
        <LayoutPicker
          scope={scope}
          funnel={funnel}
          layouts={catalog.layouts}
          onSaved={setFunnel}
          onContinue={() => goTo("map")}
        />
      ) : null}

      {phase === "map" ? (
        <StepsMapper
          scope={scope}
          funnel={funnel}
          onSaved={setFunnel}
          onContinue={(firstStepId) => goTo("step", firstStepId)}
        />
      ) : null}

      {phase === "step" && activeStep ? (
        <StepEditor
          scope={scope}
          funnel={funnel}
          catalog={catalog}
          step={activeStep}
          stepIndex={funnel.steps.findIndex((item) => item.id === activeStep.id)}
          onSaved={setFunnel}
          onSelectStep={(nextStepId) => goTo("step", nextStepId)}
        />
      ) : null}

      {phase === "step" && !activeStep ? (
        <p className="text-sm text-muted-foreground">
          Mappez d&apos;abord les étapes du funnel.
        </p>
      ) : null}
    </div>
  );
}
