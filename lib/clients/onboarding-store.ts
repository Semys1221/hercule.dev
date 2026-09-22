"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { ClientVideoConference } from "@/lib/clients/video-conference";

export type ClientOnboardingStep = "recap" | "cgv" | "welcome" | "done";

export type ClientOnboardingSlugState = {
  step: ClientOnboardingStep;
  firstNameDraft: string;
  videoConferenceDraft: ClientVideoConference | null;
  cgvAcceptedAt: string | null;
  welcomeSeenAt: string | null;
};

type ClientOnboardingStore = {
  bySlug: Record<string, ClientOnboardingSlugState>;
  hydrated: boolean;
  setHydrated: (value: boolean) => void;
  getForSlug: (slug: string) => ClientOnboardingSlugState;
  ensureSlug: (slug: string, firstName?: string | null) => void;
  setFirstNameDraft: (slug: string, value: string) => void;
  setVideoConferenceDraft: (slug: string, value: ClientVideoConference) => void;
  setStep: (slug: string, step: ClientOnboardingStep) => void;
  markCgvAccepted: (slug: string) => void;
  markWelcomeSeen: (slug: string) => void;
};

const STORAGE_NAME = "hercule-client-onboarding";

const DEFAULT_SLUG_STATE: ClientOnboardingSlugState = {
  step: "recap",
  firstNameDraft: "",
  videoConferenceDraft: null,
  cgvAcceptedAt: null,
  welcomeSeenAt: null,
};

function mergeSlugState(
  existing: ClientOnboardingSlugState | undefined,
  patch: Partial<ClientOnboardingSlugState>,
): ClientOnboardingSlugState {
  return { ...(existing ?? DEFAULT_SLUG_STATE), ...patch };
}

export const useClientOnboardingStore = create<ClientOnboardingStore>()(
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
      ensureSlug(slug, firstName) {
        set((state) => {
          const existing = state.bySlug[slug];
          if (existing) {
            if (!existing.firstNameDraft.trim() && firstName?.trim()) {
              return {
                bySlug: {
                  ...state.bySlug,
                  [slug]: mergeSlugState(existing, {
                    firstNameDraft: firstName.trim(),
                  }),
                },
              };
            }
            return state;
          }
          return {
            bySlug: {
              ...state.bySlug,
              [slug]: mergeSlugState(undefined, {
                firstNameDraft: firstName?.trim() ?? "",
              }),
            },
          };
        });
      },
      setFirstNameDraft(slug, value) {
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlugState(state.bySlug[slug], {
              firstNameDraft: value,
            }),
          },
        }));
      },
      setVideoConferenceDraft(slug, value) {
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlugState(state.bySlug[slug], {
              videoConferenceDraft: value,
            }),
          },
        }));
      },
      setStep(slug, step) {
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlugState(state.bySlug[slug], { step }),
          },
        }));
      },
      markCgvAccepted(slug) {
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlugState(state.bySlug[slug], {
              cgvAcceptedAt: new Date().toISOString(),
              step: "welcome",
            }),
          },
        }));
      },
      markWelcomeSeen(slug) {
        set((state) => ({
          bySlug: {
            ...state.bySlug,
            [slug]: mergeSlugState(state.bySlug[slug], {
              welcomeSeenAt: new Date().toISOString(),
              step: "done",
            }),
          },
        }));
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

export function selectSlugState(
  bySlug: Record<string, ClientOnboardingSlugState>,
  slug: string,
): ClientOnboardingSlugState {
  return bySlug[slug] ?? DEFAULT_SLUG_STATE;
}
