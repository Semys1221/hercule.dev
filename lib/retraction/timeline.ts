import type { TimelineStep } from "@/lib/dashboard/types";

import { addWorkingDays, formatFrenchDate } from "./dates";
import type { RetractionStatus } from "./types";

export type MilestoneItem = {
  id: string;
  label: string;
  estimatedAt: string;
  status: TimelineStep["status"];
};

export function buildActivationMilestones(params: {
  activationAt: Date;
  status: RetractionStatus;
  now?: Date;
}): MilestoneItem[] {
  const now = params.now ?? new Date();
  const { status } = params;
  const firstDays = status === "pending" ? 11 : 7;
  const firstBooking = addWorkingDays(params.activationAt, firstDays);
  const secondBooking = addWorkingDays(firstBooking, 4);
  const thirdBooking = addWorkingDays(secondBooking, 4);

  const isPast = (d: Date) => d.getTime() < now.getTime();

  return [
    {
      id: "activation",
      label: status === "pending" ? "Activation prévue" : "Service activé",
      estimatedAt: formatFrenchDate(params.activationAt),
      status: status === "pending" ? "active" : "done",
    },
    {
      id: "first_contrat",
      label: "1er contrat attribué",
      estimatedAt: `~${formatFrenchDate(addWorkingDays(params.activationAt, firstDays))}`,
      status: status === "pending" ? "pending" : isPast(firstBooking) ? "done" : "active",
    },
    {
      id: "second_contrat",
      label: "2ème contrat attribué",
      estimatedAt: `~${formatFrenchDate(secondBooking)}`,
      status: isPast(secondBooking) ? "done" : "pending",
    },
    {
      id: "third_contrat",
      label: "3ème contrat attribué",
      estimatedAt: `~${formatFrenchDate(thirdBooking)}`,
      status: isPast(thirdBooking) ? "done" : "pending",
    },
  ];
}
