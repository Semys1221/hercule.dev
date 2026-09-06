"use client";

import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DashboardData, TimelineStep } from "@/lib/dashboard/types";

import { DashboardBrandHeader, DashboardPageHeader } from "./brand-header";
import { DeliveryDetailsCard } from "./delivery-details-card";
import { NextStepBlock } from "./next-step-block";
import { NoShowDialog } from "./noshow-dialog";
import { RdvStatusCard } from "./rdv-status-card";

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

function buildDefaultMilestones(activatedAt: Date): MilestoneItem[] {
  const firstBooking = addWorkingDays(activatedAt, 7); // mid-range 6–8j
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
      id: "first_rdv",
      label: "1er RDV attribué",
      estimatedAt: `~${formatDate(firstBooking)}`,
      status: isPast(firstBooking) ? "done" : "active",
    },
    {
      id: "second_rdv",
      label: "2ème RDV attribué",
      estimatedAt: `~${formatDate(secondBooking)}`,
      status: isPast(secondBooking) ? "done" : "pending",
    },
    {
      id: "third_rdv",
      label: "3ème RDV attribué",
      estimatedAt: `~${formatDate(thirdBooking)}`,
      status: isPast(thirdBooking) ? "done" : "pending",
    },
  ];
}

type DashboardActiveProps = {
  data: DashboardData;
};

export function DashboardActive({ data }: DashboardActiveProps) {
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
    : buildDefaultMilestones(activatedAt);

  return (
    <div className="mx-auto max-w-3xl px-6 pb-20">
      <DashboardBrandHeader />

      <div className="pt-10">
        <DashboardPageHeader
          eyebrow="Suivi de votre livraison"
          title={`Commande #${data.slug.slice(0, 8).toUpperCase()}`}
          subtitle={prospectLine}
        />
      </div>

      {/* Status badges */}
      <div className="mt-6 flex flex-wrap gap-2">
        <Badge variant="outline" className="border-emerald-500/35 text-emerald-400">
          Service actif
        </Badge>
        <Badge variant="outline" className="border-primary text-foreground">
          Recherche en cours
        </Badge>
      </div>

      <NextStepBlock data={data} />
      <RdvStatusCard data={data} />

      {/* Animated chronologie */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg font-medium">Chronologie</CardTitle>
          <CardDescription>
            Estimations basées sur votre configuration d&apos;activation standard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-0">
            {milestones.map((milestone, index) => (
              <motion.li
                key={milestone.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.12, duration: 0.3 }}
                className="flex gap-4 pb-6 last:pb-0"
              >
                {/* Connector line */}
                <div className="flex flex-col items-center">
                  <span
                    className={`flex size-3 shrink-0 rounded-full ring-2 ring-background ${
                      milestone.status === "done"
                        ? "bg-emerald-500"
                        : milestone.status === "active"
                          ? "bg-primary"
                          : "bg-border"
                    }`}
                  />
                  {index < milestones.length - 1 && (
                    <span className="mt-1 w-px flex-1 bg-border" />
                  )}
                </div>

                <div className="min-w-0 pb-1">
                  <p
                    className={`font-medium ${
                      milestone.status === "pending" ? "text-muted-foreground" : ""
                    }`}
                  >
                    {milestone.label}
                  </p>
                  {milestone.estimatedAt && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {milestone.estimatedAt}
                    </p>
                  )}
                  {milestone.status === "active" && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="mt-0.5 text-xs text-primary"
                    >
                      En recherche active
                    </motion.p>
                  )}
                </div>
              </motion.li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <DeliveryDetailsCard data={data} />

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
