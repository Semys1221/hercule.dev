"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mergeFunnelState } from "./navigation";
import type { FunnelAnswers, FunnelPhase, FunnelRouteSegment, FunnelStepId } from "./schema";

export type SlugFunnelState = {
  routeSegment: FunnelRouteSegment | null;
  currentStepId: FunnelStepId;
  phase: FunnelPhase;
  answers: FunnelAnswers;
  serverSynced: boolean;
  syncedAt: string | null;
};

type ComptableDeliveryFunnelStore = {
  bySlug: Record<string, SlugFunnelState>;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  getForSlug: (slug: string) => SlugFunnelState;
  ensureSlug: (
    slug: string,
    routeSegment: FunnelRouteSegment,
    overrides?: Partial<SlugFunnelState>,
  ) => void;
  setAnswer: (slug: string, stepId: FunnelStepId, value: string) => void;
  setCurrentStep: (slug: string, stepId: FunnelStepId) => void;
  setPhase: (slug: string, phase: FunnelPhase) => void;
  hydrateFromServer: (
    slug: string,
    payload: {
      routeSegment: FunnelRouteSegment;
      currentStepId: FunnelStepId;
      phase: FunnelPhase;
      answers: FunnelAnswers;
    },
  ) => void;
  mergeWithServer: (
    slug: string,
    payload: {
      routeSegment: FunnelRouteSegment;
      currentStepId: FunnelStepId;
      phase: FunnelPhase;
      answers: FunnelAnswers;
    },
  ) => void;
  markServerSynced: (slug: string) => void;
};

const STORAGE_NAME = "hercule-comptable-delivery-funnel";

const DEFAULT_SLUG_STATE: SlugFunnelState = {
  routeSegment: null,
  currentStepId: "intro",
  phase: "pre_booking",
  answers: {},
  serverSynced: false,
  syncedAt: null,
};

function mergeSlug(
  existing: SlugFunnelState | undefined,
  patch: Partial<SlugFunnelState>,
): SlugFunnelState {
  return { ...(existing ?? DEFAULT_SLUG_STATE), ...patch };
}

export const useComptableDeliveryFunnelStore = create<ComptableDeliveryFunnelStore>()(
  persist(
    (set, get) => ({
      bySlug: {},
      hydrated: false,
      setHydrated(value) {
        set({ hydrated: value });
      },
      getForSlug(slug) {
        return get().bySlug[slug] ?? DEFAULT_SLUG_STATE;
      },
      ensureSlug(slug, routeSegment, overrides) {
        set((state) => {
          const existing = state.bySlug[slug];
          if (existing) {
            return {
              bySlug: {
                ...state.bySlug,
                [slug]: mergeSlug(existing, {
                  routeSegment,
                  ...overrides,
                }),
              },
            };
          }
          return {
            bySlug: {
              ...state.bySlug,
              [slug]: mergeSlug(undefined, {
                routeSegment,
                ...overrides,
              }),
            },
          };
        });
      },
      setAnswer(slug, stepId, value) {
        set((state) => {
          const existing = state.bySlug[slug] ?? DEFAULT_SLUG_STATE;
          return {
            bySlug: {
              ...state.bySlug,
              [slug]: mergeSlug(existing, {
                answers: { ...existing.answers, [stepId]: value },
              }),
            },
          };
        });
      },
      setCurrentStep(slug, stepId) {
        set((state) => {
          const existing = state.bySlug[slug] ?? DEFAULT_SLUG_STATE;
          return {
            bySlug: {
              ...state.bySlug,
              [slug]: mergeSlug(existing, { currentStepId: stepId }),
            },
          };
        });
      },
      setPhase(slug, phase) {
        set((state) => {
          const existing = state.bySlug[slug] ?? DEFAULT_SLUG_STATE;
          return {
            bySlug: {
              ...state.bySlug,
              [slug]: mergeSlug(existing, { phase }),
            },
          };
        });
      },
      hydrateFromServer(slug, payload) {
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlug(undefined, {
              routeSegment: payload.routeSegment,
              currentStepId: payload.currentStepId,
              phase: payload.phase,
              answers: payload.answers,
              serverSynced: true,
              syncedAt: new Date().toISOString(),
            }),
          },
        }));
      },
      mergeWithServer(slug, payload) {
        const local = get().bySlug[slug] ?? DEFAULT_SLUG_STATE;
        const merged = mergeFunnelState(
          {
            currentStepId: payload.currentStepId,
            phase: payload.phase,
            answers: payload.answers,
          },
          {
            currentStepId: local.currentStepId,
            phase: local.phase,
            answers: local.answers,
          },
        );
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlug(local, {
              routeSegment: payload.routeSegment,
              currentStepId: merged.currentStepId,
              phase: merged.phase,
              answers: merged.answers,
              serverSynced: true,
              syncedAt: new Date().toISOString(),
            }),
          },
        }));
      },
      markServerSynced(slug) {
        set((state) => {
          const existing = state.bySlug[slug] ?? DEFAULT_SLUG_STATE;
          return {
            bySlug: {
              ...state.bySlug,
              [slug]: mergeSlug(existing, {
                serverSynced: true,
                syncedAt: new Date().toISOString(),
              }),
            },
          };
        });
      },
    }),
    {
      name: STORAGE_NAME,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ bySlug: state.bySlug }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
