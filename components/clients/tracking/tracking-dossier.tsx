import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClientAppointmentsCard } from "@/components/clients/client-appointments-card";
import { ClientRenewalInfoDialog } from "@/components/clients/client-renewal-info-dialog";
import { ClientRetractionWaiverCard } from "@/components/clients/client-retraction-waiver-card";
import { ClientBillingPortalButton } from "@/components/clients/client-subscription-card";
import type { ClientCalendlySeat, ClientDashboardData } from "@/lib/clients/types";
import {
  clientEngagementLabel,
  conferenceOfferLabel,
  CONFERENCE_CLIENT_TYPES,
} from "@/lib/commercial/conference-pricing";
import { videoConferenceLabel } from "@/lib/clients/video-conference";
type TrackingDossierProps = {
  data: ClientDashboardData;
  onRefresh?: () => void;
};

function calendlyLabel(seat: ClientCalendlySeat | null): string {
  if (!seat) return "Invitation en préparation";
  if (seat.invitationStatus === "accepted" || seat.status === "active") {
    return "Connecté";
  }
  if (seat.invitationStatus === "pending" || seat.status === "invite_pending") {
    return "Invitation envoyée";
  }
  if (seat.status === "reminder_sent") return "Rappel envoyé";
  return "Invitation en cours";
}

export function TrackingDossier({ data, onRefresh }: TrackingDossierProps) {
  const connected =
    data.calendlySeat?.invitationStatus === "accepted" || data.calendlySeat?.status === "active";
  const formuleLabel = conferenceOfferLabel(data.offerType);
  const engagement = clientEngagementLabel({
    clientType: data.clientType,
    billing: data.billing,
  });

  return (
    <aside className="flex flex-col gap-8">
      <section aria-labelledby="dossier-summary" className="flex flex-col gap-4">
        <h2 id="dossier-summary" className="text-base font-semibold">
          Dossier
        </h2>
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Formule</dt>
            <dd className="text-right font-medium">{formuleLabel}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Engagement</dt>
            <dd className="flex items-center justify-end gap-1 text-right">
              <span>{engagement}</span>
              {data.clientType === CONFERENCE_CLIENT_TYPES.dec ? (
                <ClientRenewalInfoDialog />
              ) : null}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Rendez-vous</dt>
            <dd className="font-medium tabular-nums text-tracking">
              {data.rdvUsed} / {data.rdvTotal}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">Calendrier</dt>
            <dd>
              {connected ? (
                <span className="font-medium">Connecté</span>
              ) : (
                <Badge variant="secondary">{calendlyLabel(data.calendlySeat)}</Badge>
              )}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">Visioconférence</dt>
            <dd className="text-right font-medium">
              {videoConferenceLabel(data.videoConference)}
            </dd>
          </div>
        </dl>
        {data.billingPortal.available ? (
          <ClientBillingPortalButton slug={data.slug} available={data.billingPortal.available} />
        ) : null}
      </section>

      <Separator className="bg-border/40" />

      <ClientRetractionWaiverCard data={data} onSuccess={onRefresh} />

      <section aria-labelledby="appointments-section">
        <ClientAppointmentsCard
          slug={data.slug}
          appointments={data.appointments ?? []}
          onRefresh={onRefresh}
          borderless
        />
      </section>
    </aside>
  );
}
