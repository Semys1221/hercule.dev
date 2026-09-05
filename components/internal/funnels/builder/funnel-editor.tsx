"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { FunnelOptionsMenu } from "@/components/internal/funnels/builder/funnel-options-menu";
import { FunnelList } from "@/components/internal/funnels/builder/funnel-list";
import { LayoutPicker } from "@/components/internal/funnels/builder/layout-picker";
import { StepEditor } from "@/components/internal/funnels/builder/step-editor";
import { StepsMapper } from "@/components/internal/funnels/builder/steps-mapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import type { FunnelCatalog } from "@/lib/admin/funnels/catalog-types";
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

function FunnelEditorSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full max-w-md" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

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
    return <FunnelEditorSkeleton />;
  }

  if (error || !funnel || !catalog) {
    return (
      <InternalStatusAlert
        variant="error"
        message={error ?? "Funnel introuvable"}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="sticky top-0 z-10 space-y-4 bg-background/95 pb-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{funnel.displayName}</h2>
            <p className="text-sm text-muted-foreground">
              {funnel.slug} · {funnel.status} · {funnel.publicPath}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <FunnelOptionsMenu
              context="editor"
              scope={scope}
              navPath={navPath}
              slug={funnel.slug}
              displayName={funnel.displayName}
              status={funnel.status}
              funnel={funnel}
              catalog={catalog}
              onPublished={() => void load()}
              onError={setError}
            />
            <Button asChild variant="outline" size="sm">
              <Link href={funnelListHref(navPath)}>Retour à la liste</Link>
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        value={phase}
        onValueChange={(value) => {
          if (value === "layout") {
            goTo("layout");
          } else if (value === "map") {
            goTo("map");
          } else if (value === "step") {
            goTo("step", activeStep?.id);
          }
        }}
      >
        <TabsList>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="map">Étapes</TabsTrigger>
          <TabsTrigger value="step" disabled={funnel.steps.length === 0}>
            Contenu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="mt-6">
          <LayoutPicker
            scope={scope}
            funnel={funnel}
            layouts={catalog.layouts}
            onSaved={setFunnel}
            onContinue={() => goTo("map")}
          />
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <StepsMapper
            scope={scope}
            funnel={funnel}
            onSaved={setFunnel}
            onContinue={(firstStepId) => goTo("step", firstStepId)}
          />
        </TabsContent>

        <TabsContent value="step" className="mt-6">
          {activeStep ? (
            <StepEditor
              scope={scope}
              funnel={funnel}
              catalog={catalog}
              step={activeStep}
              stepIndex={funnel.steps.findIndex((item) => item.id === activeStep.id)}
              onSaved={setFunnel}
              onSelectStep={(nextStepId) => goTo("step", nextStepId)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Mappez d&apos;abord les étapes du funnel.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
