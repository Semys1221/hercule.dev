"use client";

import { useEffect, useState } from "react";

import type { ConferenceSaleWindowPublic } from "@/lib/conference/sale-window";
import { CONFERENCE_INSCRIPTION_MESSAGES } from "@/lib/conference/sale-window";

const DISABLED_WINDOW: ConferenceSaleWindowPublic = {
  status: "closed",
  phase: "closed",
  checkoutOpen: false,
  inactiveMessage: CONFERENCE_INSCRIPTION_MESSAGES.closed,
  startedAt: null,
  decTaken: 0,
  courtageTaken: 0,
};

export type UseConferenceSaleWindowOptions = {
  poll?: boolean;
  pollMs?: number;
};

export function useConferenceSaleWindow(
  options: UseConferenceSaleWindowOptions = {},
) {
  const { poll = true, pollMs = 2000 } = options;
  const [windowState, setWindowState] =
    useState<ConferenceSaleWindowPublic>(DISABLED_WINDOW);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/conference/sale-window", {
          cache: "no-store",
        });
        const body = (await response.json()) as ConferenceSaleWindowPublic;
        if (!cancelled && typeof body?.checkoutOpen === "boolean") {
          setWindowState(body);
        }
      } catch {
        /* keep last snapshot */
      }
    }

    void load();

    if (!poll) {
      return () => {
        cancelled = true;
      };
    }

    const id = setInterval(() => {
      void load();
    }, pollMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [poll, pollMs]);

  return windowState;
}
