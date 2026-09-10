"use client";

import type { PresetOpportunityCard } from "@/lib/admin/funnels/sales-preset-registry";
import { formatContractWindow } from "@/lib/admin/funnels/sales-preset-registry";
import type { ClientSegment } from "@/lib/admin/funnels/client-segment";
import { interpolateClientSegment } from "@/lib/admin/funnels/client-segment";
import type { Audience } from "@/lib/admin/navigation";
import { getSecteurConfig } from "@/lib/agence/secteur-config";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { cn } from "@/lib/utils";

import type { CalendarMeeting } from "./sales-calendrier-dates";
import { phaseAtLeast, type RevealPhase } from "./sales-calendrier-reveal";

type SalesCalendrierBookingLegendProps = {
  audience?: Audience;
  cards: PresetOpportunityCard[];
  meetings: CalendarMeeting[];
  today: Date;
  phase: RevealPhase;
  clientSegment?: ClientSegment;
};

export function SalesCalendrierBookingLegend({
  audience = "agence",
  cards,
  meetings,
  today,
  phase,
  clientSegment,
}: SalesCalendrierBookingLegendProps) {
  const cardById = new Map(cards.map((card) => [card.id, card]));
  const showBookingLive = phaseAtLeast(phase, "booking");

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <p className="text-sm text-muted-foreground">
        5 rendez-vous planifiés sur vos créneaux provisionnés
      </p>
      <div
        className="space-y-2"
        aria-live={showBookingLive ? "polite" : undefined}
        aria-label={
          audience === "comptable"
            ? clientSegment
              ? interpolateClientSegment(
                  "Rendez-vous planifiés par mission {clientSegment}",
                  clientSegment,
                )
              : "Rendez-vous planifiés par mission TPE"
            : "Rendez-vous planifiés par opportunité"
        }
      >
        {meetings.map((meeting) => {
          const card = cardById.get(meeting.cardId);
          if (!card) {
            return null;
          }

          const { icon: Icon, iconClass, iconBoxClass } = getSecteurConfig(
            card.secteur,
            "internal",
          );

          return (
            <Item key={meeting.cardId} variant="outline" size="sm">
              <ItemMedia variant="icon">
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg border",
                    iconBoxClass,
                  )}
                >
                  <Icon className={cn("size-4", iconClass)} aria-hidden />
                </div>
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{card.secteur}</ItemTitle>
                <ItemDescription>{formatContractWindow(card, today)}</ItemDescription>
              </ItemContent>
            </Item>
          );
        })}
      </div>
    </div>
  );
}
