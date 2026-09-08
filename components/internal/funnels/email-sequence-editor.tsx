"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import { FunnelPlaceholder } from "@/components/internal/funnels/placeholder";
import { createBookingAdapter } from "@/components/internal/funnels/sequence-editor/adapters/booking-adapter";
import { createBypassAdapter } from "@/components/internal/funnels/sequence-editor/adapters/bypass-adapter";
import { createReplyAgentAdapter } from "@/components/internal/funnels/sequence-editor/adapters/reply-agent-adapter";
import { SequenceDropdown } from "@/components/internal/funnels/sequence-editor/sequence-dropdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BOOKING_SEQUENCE_SLUGS,
  bookingSequenceTypesFor,
  getEmailSequence,
  PHASE_LABELS,
  type EmailSequenceEntry,
} from "@/lib/admin/email-sequences/registry";
import type { Audience } from "@/lib/admin/navigation";
import type { BypassTemplateKey } from "@/lib/instantly-bypass/types";

import type { SequenceEditorAdapter } from "./sequence-editor/types";

type EmailSequenceEditorProps = {
  audience: Audience;
  sequenceSlug: string;
};

type InstantlyCampaign = { id: string; name: string };

function SpecSequencePlaceholder({ sequence }: { sequence: EmailSequenceEntry }) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold">{sequence.name}</h2>
          <Badge variant="outline">Spec</Badge>
          <Badge variant="secondary">{PHASE_LABELS[sequence.phase]}</Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{sequence.description}</p>
      </div>

      <FunnelPlaceholder
        title="Éditeur à implémenter"
        detail="Cette séquence est documentée dans le tech-stack legacy mais n'a pas encore de source of truth éditable dans l'app Next.js."
      />

      {sequence.steps.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Steps prévues</CardTitle>
            <CardDescription>
              Délais issus de la spec — non éditables en V1.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {sequence.steps.map((step) => (
              <div
                key={step.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2"
              >
                <span className="font-medium">{step.label}</span>
                <Badge variant="outline">{step.delay}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {sequence.legacyDoc ? (
        <p className="text-sm text-muted-foreground">
          Documentation :{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">{sequence.legacyDoc}</code>
        </p>
      ) : null}
    </div>
  );
}

function OutreachStatsPlaceholder({ sequence }: { sequence: EmailSequenceEntry }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{sequence.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{sequence.description}</p>
      </div>
      <FunnelPlaceholder
        title="Statistiques Outreach"
        detail="L'édition des campagnes Outreach reste dans Instantly. Cette section enregistre et analyse les stats — formulaire complet à venir."
      />
      {sequence.streamlitHint ? (
        <p className="text-sm text-muted-foreground">
          Outil actuel : <code className="rounded bg-muted px-1">{sequence.streamlitHint}</code>
        </p>
      ) : null}
    </div>
  );
}

function CampaignSelector({
  campaignId,
  onCampaignChange,
}: {
  campaignId: string | null;
  onCampaignChange: (id: string) => void;
}) {
  const [campaigns, setCampaigns] = useState<InstantlyCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCampaigns = useCallback(async (refresh = false) => {
    setError(null);
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const url = refresh
        ? "/api/admin/instantly-campaigns?refresh=1"
        : "/api/admin/instantly-campaigns";
      const response = await fetch(url);
      const body = (await response.json()) as {
        campaigns?: InstantlyCampaign[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement campagnes impossible");
      }
      setCampaigns(body.campaigns ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  if (loading) {
    return <Skeleton className="h-10 w-full max-w-md" />;
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-[280px] flex-1 space-y-2">
        <label className="text-sm font-medium">Campagne Instantly</label>
        <Select
          value={campaignId ?? ""}
          onValueChange={onCampaignChange}
          disabled={campaigns.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner une campagne" />
          </SelectTrigger>
          <SelectContent>
            {campaigns.map((campaign) => (
              <SelectItem key={campaign.id} value={campaign.id}>
                {campaign.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={refreshing}
        onClick={() => void loadCampaigns(true)}
      >
        <RefreshCw className={`mr-2 size-4 ${refreshing ? "animate-spin" : ""}`} />
        Rafraîchir
      </Button>
    </div>
  );
}

function buildAdapter(
  sequence: EmailSequenceEntry,
  audience: Audience,
  campaignId: string | null,
): SequenceEditorAdapter | null {
  if (sequence.editorKind === "booking") {
    const emailTypes = bookingSequenceTypesFor(sequence.slug, audience);
    const rawCategory = sequence.bookingCategory ?? audience;
    if (rawCategory !== "agence" && rawCategory !== "entreprise") {
      return null;
    }
    const category = rawCategory;
    const typedSteps = sequence.steps.filter(
      (step) => step.emailType && emailTypes.includes(step.emailType),
    );
    const stepMeta = (typedSteps.length > 0 ? typedSteps : sequence.steps).map(
      (step) => ({
        id: step.id,
        label: step.label,
        delay: step.delay,
      }),
    );
    return createBookingAdapter({
      category,
      emailTypes: emailTypes.length > 0 ? emailTypes : (BOOKING_SEQUENCE_SLUGS[sequence.slug] ?? []),
      stepMeta,
    });
  }

  if (sequence.editorKind === "bypass" && campaignId && sequence.bypassTemplateKeys) {
    const stepMeta = sequence.steps
      .filter((step) => step.templateKey)
      .map((step) => ({
        id: step.id,
        label: step.label,
        delay: step.delay,
        templateKey: step.templateKey as BypassTemplateKey,
      }));
    return createBypassAdapter({
      campaignId,
      templateKeys: sequence.bypassTemplateKeys,
      stepMeta,
    });
  }

  if (sequence.editorKind === "reply_agent" && campaignId) {
    return createReplyAgentAdapter({ campaignId });
  }

  return null;
}

export function EmailSequenceEditor({
  audience,
  sequenceSlug,
}: EmailSequenceEditorProps) {
  const sequence = useMemo(() => getEmailSequence(sequenceSlug), [sequenceSlug]);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  if (!sequence) {
    return (
      <FunnelPlaceholder
        title="Séquence introuvable"
        detail={`Aucune séquence pour le slug « ${sequenceSlug} ».`}
      />
    );
  }

  if (sequence.editorKind === "outreach_stats") {
    return <OutreachStatsPlaceholder sequence={sequence} />;
  }

  if (sequence.status === "spec" || sequence.editorKind === "placeholder") {
    return <SpecSequencePlaceholder sequence={sequence} />;
  }

  const needsCampaign =
    sequence.editorKind === "bypass" || sequence.editorKind === "reply_agent";

  const adapter = buildAdapter(sequence, audience, campaignId);

  return (
    <div className="space-y-6">
      {needsCampaign ? (
        <CampaignSelector campaignId={campaignId} onCampaignChange={setCampaignId} />
      ) : null}

      {!needsCampaign && adapter ? (
        <SequenceDropdown
          title={sequence.name}
          description={sequence.description}
          adapter={adapter}
        />
      ) : null}

      {needsCampaign && !campaignId ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Sélectionnez une campagne</EmptyTitle>
            <EmptyDescription>
              L&apos;éditeur apparaît après sélection d&apos;une campagne Instantly.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/internal/funnels/${audience}/emails`}>
                Retour au tableau
              </Link>
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {needsCampaign && campaignId && adapter ? (
        <SequenceDropdown
          key={`${sequence.slug}-${campaignId}`}
          title={sequence.name}
          description={sequence.description}
          adapter={adapter}
        />
      ) : null}

      {sequence.streamlitHint ? (
        <p className="text-xs text-muted-foreground">
          Outil Streamlit legacy :{" "}
          <code className="rounded bg-muted px-1">{sequence.streamlitHint}</code>
        </p>
      ) : null}
    </div>
  );
}
