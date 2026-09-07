"use client";

import { Copy, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import type { ClientCockpitData } from "@/lib/admin/clients/types";

type CockpitHeaderActionsProps = {
  data: ClientCockpitData;
};

function resolveDashboardUrl(data: ClientCockpitData): string | null {
  if (data.dashboardLink) return data.dashboardLink;
  if (data.category === "agence") {
    return `/dashboard/${data.slug}`;
  }
  return null;
}

export function CockpitHeaderActions({ data }: CockpitHeaderActionsProps) {
  const dashboardUrl = resolveDashboardUrl(data);

  async function copyLink() {
    if (!dashboardUrl) return;
    const absolute =
      dashboardUrl.startsWith("http")
        ? dashboardUrl
        : `${window.location.origin}${dashboardUrl}`;
    try {
      await navigator.clipboard.writeText(absolute);
      toast({ title: "Lien copié", description: absolute });
    } catch {
      toast({
        variant: "destructive",
        title: "Copie impossible",
        description: "Autorisez l'accès au presse-papiers.",
      });
    }
  }

  if (data.category !== "agence") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button type="button" variant="outline" size="sm" disabled>
                Aperçu dashboard
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            Pas de dashboard agence pour une fiche entreprise.
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {dashboardUrl ? (
        <Button variant="outline" size="sm" asChild>
          <a href={dashboardUrl} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-3.5" />
            Aperçu dashboard
          </a>
        </Button>
      ) : null}
      {dashboardUrl ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => void copyLink()}>
          <Copy className="size-3.5" />
          Copier le lien
        </Button>
      ) : null}
    </div>
  );
}
