"use client";

import {
  CalendarCheck,
  CalendarRange,
  ClipboardList,
  Package,
  Phone,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { TrackingStationId, TrackingStationState } from "@/lib/clients/tracking/script";

const STATION_ICONS: Record<TrackingStationId, LucideIcon> = {
  commande: Package,
  installation: CalendarRange,
  volume: ClipboardList,
  qualification: SlidersHorizontal,
  solvabilite: Phone,
  agenda: CalendarCheck,
};

const DISK_CLASS = {
  active: "bg-tracking-muted text-tracking ring-1 ring-tracking-border",
  reached: "bg-muted text-muted-foreground",
  pending: "bg-muted/50 text-muted-foreground",
} as const;

type TrackingRailProps = {
  stations: TrackingStationState[];
};

export function TrackingRail({ stations }: TrackingRailProps) {
  const last = stations.length - 1;
  const activeIndex = stations.findIndex((station) => station.status === "active");
  const progress =
    activeIndex >= 0 ? (activeIndex / Math.max(last, 1)) * 100 : 0;

  return (
    <nav
      aria-label="Postes du déploiement"
      className="relative overflow-x-auto py-1"
    >
      <div
        className="pointer-events-none absolute top-5 right-[10%] left-[10%] hidden h-px bg-border/60 sm:block"
        aria-hidden
      >
        <span
          className="block h-full bg-tracking/40 transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <ol className="relative flex min-w-max items-start sm:min-w-0">
        {stations.map((station) => {
          const Icon = STATION_ICONS[station.id];
          const active = station.status === "active";
          const reached = station.status !== "pending";

          return (
            <li
              key={station.id}
              aria-current={active ? "step" : undefined}
              className="relative flex w-24 shrink-0 flex-col items-center sm:w-auto sm:min-w-0 sm:flex-1"
            >
              <div
                className={cn(
                  "flex flex-col items-center gap-2 px-1 transition-opacity duration-300 sm:px-2",
                  active ? "opacity-100" : reached ? "opacity-80" : "opacity-50",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full transition-colors duration-300",
                    active
                      ? DISK_CLASS.active
                      : reached
                        ? DISK_CLASS.reached
                        : DISK_CLASS.pending,
                  )}
                >
                  <Icon className="size-4 shrink-0" aria-hidden />
                </span>
                <span
                  className={cn(
                    "w-full text-center text-xs font-medium leading-tight transition-colors duration-300 sm:text-sm",
                    active ? "text-tracking" : "text-muted-foreground",
                  )}
                >
                  {station.label}
                </span>
                <span className="w-full text-center text-[11px] leading-tight text-muted-foreground sm:text-xs">
                  {station.hint}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
