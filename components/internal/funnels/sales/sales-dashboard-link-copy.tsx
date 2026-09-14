"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { isCabinetBuyerSalesAudience } from "@/lib/admin/funnels/sales-audience";
import { SESSION_DEVELOPER_MODE_FAKE_LINK } from "@/lib/admin/funnels/ui-copy";
import { resolveSalesSessionDashboardLink } from "@/lib/link-tracking/urls";
import type { LinkTrackingLead } from "@/lib/link-tracking/types";
import type { EnrichedCalendlyBooking } from "@/lib/calendly/enrich-bookings";
import type { Audience } from "@/lib/admin/navigation";

type SalesDashboardLinkCopyProps = {
  audience: Audience;
  selectedLead: LinkTrackingLead | null;
  selectedBooking: EnrichedCalendlyBooking | null;
  developerMode?: boolean;
  onRefreshLead?: () => Promise<void>;
};

export function SalesDashboardLinkCopy({
  audience,
  selectedLead,
  selectedBooking,
  developerMode = false,
  onRefreshLead,
}: SalesDashboardLinkCopyProps) {
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const dashboardResolution = useMemo(
    () =>
      resolveSalesSessionDashboardLink({
        lead: selectedLead,
        bookingDashboardLink: selectedBooking?.links?.dashboard_link,
        bookingSlug: selectedBooking?.slug,
        developerMode,
        origin: typeof window !== "undefined" ? window.location.origin : undefined,
      }),
    [developerMode, selectedBooking?.links?.dashboard_link, selectedBooking?.slug, selectedLead],
  );
  const dashboardLink = dashboardResolution.link;
  const usingFakeDashboardLink = dashboardResolution.isFake;

  const handleCopyDashboard = useCallback(async () => {
    if (!dashboardLink) return;
    await navigator.clipboard.writeText(dashboardLink);
    setCopied(true);
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
  }, [dashboardLink]);

  const handleRefresh = useCallback(async () => {
    if (!onRefreshLead) return;
    setRefreshing(true);
    try {
      await onRefreshLead();
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshLead]);

  const linkLabel = isCabinetBuyerSalesAudience(audience)
    ? "Lien dashboard cabinet"
    : "Lien dashboard client";

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Lien dashboard à transmettre au{" "}
        {isCabinetBuyerSalesAudience(audience) ? "cabinet" : "prospect"}. Le choix de formule et
        le paiement s&apos;effectuent sur le tableau de bord, en dehors de la session.
      </p>

      {!developerMode && !selectedLead ? (
        <InternalStatusAlert
          variant="error"
          message="Aucun lead associé — sélectionnez un rendez-vous avec fiche CRM sur l'étape Rendez-vous."
        />
      ) : null}

      {usingFakeDashboardLink ? (
        <InternalStatusAlert variant="info" message={SESSION_DEVELOPER_MODE_FAKE_LINK} />
      ) : null}

      {dashboardLink ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">{linkLabel}</p>
          <code className="block break-all rounded-md border border-border bg-muted/30 p-3 text-sm">
            {dashboardLink}
          </code>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleCopyDashboard}>
              {copied ? "Copié" : "Copier le lien"}
            </Button>
            {onRefreshLead && !usingFakeDashboardLink ? (
              <Button type="button" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? "Rafraîchissement…" : "Rafraîchir le lien"}
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <InternalStatusAlert
            variant="error"
            message="Le lien dashboard n'est pas encore disponible. Il est généré au webhook Calendly MEETING_BOOKED."
          />
          {onRefreshLead ? (
            <Button type="button" variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Rafraîchissement…" : "Rafraîchir le lead"}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function useSalesSessionDashboardLink(
  selectedLead: LinkTrackingLead | null,
  selectedBooking: EnrichedCalendlyBooking | null,
  developerMode = false,
): string | null {
  return useMemo(() => {
    return resolveSalesSessionDashboardLink({
      lead: selectedLead,
      bookingDashboardLink: selectedBooking?.links?.dashboard_link,
      bookingSlug: selectedBooking?.slug,
      developerMode,
      origin: typeof window !== "undefined" ? window.location.origin : undefined,
    }).link;
  }, [
    developerMode,
    selectedBooking?.links?.dashboard_link,
    selectedBooking?.slug,
    selectedLead,
  ]);
}
