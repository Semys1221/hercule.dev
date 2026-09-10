"use client";

import { Badge } from "@/components/ui/badge";
import type { DashboardData, TimelineStep } from "@/lib/dashboard/types";
import { agenceFirstContratAt } from "@/lib/retraction/dates";
import {
  DASHBOARD_EYEBROW,
  DASHBOARD_RETRACTION_BADGE_ACTIVE,
  DASHBOARD_RETRACTION_BADGE_PENDING,
  dashboardPageTitle,
} from "@/lib/dashboard/copy";

import { ChronologieSection } from "./chronologie-section";
import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { DeliveryDetailsCard } from "./delivery-details-card";
import { NextStepBlock } from "./next-step-block";
import { NoShowDialog } from "./noshow-dialog";
import { PostPaymentFaqLink } from "./post-payment-faq-link";
import { BalancePaymentCard } from "./balance-payment-card";
import { RdvStatusCard } from "./rdv-status-card";
import { RetractionWaiverCard } from "./retraction-waiver-card";

/** Working-day offset helper — skips Sat/Sun from a reference date. */
function addWorkingDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) {
      added++;
    }
  }
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });
}

type MilestoneItem = {
  id: string;
  label: string;
  estimatedAt: string;
  status: TimelineStep["status"];
};

function buildDefaultMilestones(
  activatedAt: Date,
  isFastCheckout = false,
): MilestoneItem[] {
  const firstBooking = agenceFirstContratAt(activatedAt, "waived", isFastCheckout);
  const secondBooking = addWorkingDays(firstBooking, 4);
  const thirdBooking = addWorkingDays(secondBooking, 4);

  const now = Date.now();
  const isPast = (d: Date) => d.getTime() < now;

  return [
    {
      id: "activation",
      label: "Service activé",
      estimatedAt: formatDate(activatedAt),
      status: "done",
    },
    {
      id: "first_contrat",
      label: "1er contrat attribué",
      estimatedAt: `~${formatDate(firstBooking)}`,
      status: isPast(firstBooking) ? "done" : "active",
    },
    {
      id: "second_contrat",
      label: "2ème contrat attribué",
      estimatedAt: `~${formatDate(secondBooking)}`,
      status: isPast(secondBooking) ? "done" : "pending",
    },
    {
      id: "third_contrat",
      label: "3ème contrat attribué",
      estimatedAt: `~${formatDate(thirdBooking)}`,
      status: isPast(thirdBooking) ? "done" : "pending",
    },
  ];
}

type DashboardActiveProps = {
  data: DashboardData;
  onRefresh?: () => void;
};

export function DashboardActive({ data, onRefresh }: DashboardActiveProps) {
  const greeting = data.firstName || "Bonjour";
  const prospectLine = data.company ? `${greeting} · ${data.company}` : greeting;

  // Use server-side timeline if provided, otherwise compute defaults
  const hasServerTimeline =
    data.timeline.length > 0 &&
    data.timeline.some((s) => s.id !== "confirmed");

  const activatedAt = new Date(); // fallback: now
  const milestones: MilestoneItem[] = hasServerTimeline
    ? data.timeline.map((s) => ({
        id: s.id,
        label: s.label,
        estimatedAt: s.meta ?? "",
        status: s.status,
      }))
    : buildDefaultMilestones(activatedAt, data.paymentSchedule?.isFastCheckout ?? false);

  const chronologieSteps = milestones.map((milestone) => ({
    id: milestone.id,
    label: milestone.label,
    meta: milestone.estimatedAt || undefined,
    status: milestone.status,
  }));

  const retractionPending = data.retraction?.status === "pending";
  const isDeliverance =
    data.productStatut === "IN_DELIVERANCE" ||
    data.productStatut === "MATCH_PROPOSED" ||
    data.productStatut === "MEETING_BOOKED";

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20">
      <DashboardBrandHeader />

      <div className="pt-10">
        <DashboardPageHeader
          eyebrow={DASHBOARD_EYEBROW}
          title={dashboardPageTitle(data.slug)}
          subtitle={prospectLine}
        />
      </div>

      <ChronologieSection
        steps={chronologieSteps}
        description={
          retractionPending
            ? "Estimations incluant votre délai de rétractation de 4 jours."
            : "Estimations basées sur votre configuration d'activation standard."
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={
            retractionPending
              ? "border-amber-500/35 text-amber-400"
              : "border-emerald-500/35 text-emerald-400"
          }
        >
          {retractionPending
            ? DASHBOARD_RETRACTION_BADGE_PENDING
            : DASHBOARD_RETRACTION_BADGE_ACTIVE}
        </Badge>
        {isDeliverance && !retractionPending ? (
          <Badge variant="outline" className="border-primary text-foreground">
            Recherche en cours
          </Badge>
        ) : null}
      </div>

      <RetractionWaiverCard data={data} onSuccess={onRefresh} />

      <NextStepBlock data={data} />
      <RdvStatusCard data={data} />
      <BalancePaymentCard data={data} onRefresh={onRefresh ?? (() => {})} />

      {data.deliveryPlan ? (
        <>
          <DeliveryDetailsCard
            deliveryPlan={data.deliveryPlan}
            enterpriseBrief={data.enterpriseBrief}
            paymentSchedule={data.paymentSchedule}
          />
          <PostPaymentFaqLink />
        </>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 border-t border-border pt-8">
        <NoShowDialog slug={data.slug} />

        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Une question ?</p>
          <p>
            Notre équipe répond 7j/7, délai maximal 24 h (réponse à 9h, heure de Paris).
          </p>
          <a
            href="mailto:contact@hercule.dev"
            className="underline underline-offset-2 hover:text-foreground"
          >
            contact@hercule.dev
          </a>
        </div>
      </div>
    </div>
  );
}
