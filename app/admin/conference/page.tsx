"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CONFERENCE_INSCRIPTION_MESSAGES,
  type ConferenceRegistrationPhase,
  type ConferenceSaleWindowPublic,
} from "@/lib/conference/sale-window";

const PHASES: { phase: ConferenceRegistrationPhase; label: string }[] = [
  { phase: "waiting", label: "Patienter" },
  { phase: "open", label: "Ouvrir" },
  { phase: "closed", label: "Fermer" },
];

export default function ConferenceRegistrationAdminPage() {
  const [windowState, setWindowState] =
    useState<ConferenceSaleWindowPublic | null>(null);
  const [pending, setPending] = useState<ConferenceRegistrationPhase | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/admin/conference/sale-window", {
          cache: "no-store",
        });
        const body = (await response.json()) as ConferenceSaleWindowPublic & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(body.error || "État indisponible");
        }
        if (!cancelled) setWindowState(body);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "État indisponible");
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function setPhase(phase: ConferenceRegistrationPhase) {
    setPending(phase);
    setError(null);
    try {
      const response = await fetch("/api/admin/conference/sale-window", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });
      const body = (await response.json()) as ConferenceSaleWindowPublic & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error || "Mise à jour impossible");
      }
      setWindowState(body);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Mise à jour impossible");
    } finally {
      setPending(null);
    }
  }

  const active = windowState?.phase;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Inscriptions conférence</CardTitle>
          <CardDescription>
            {windowState
              ? CONFERENCE_INSCRIPTION_MESSAGES[windowState.phase]
              : "Chargement…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {PHASES.map(({ phase, label }) => (
            <Button
              key={phase}
              type="button"
              variant={active === phase ? "default" : "outline"}
              disabled={pending !== null}
              onClick={() => void setPhase(phase)}
            >
              {pending === phase ? "…" : label}
            </Button>
          ))}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
