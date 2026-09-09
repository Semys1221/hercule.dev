"use client";

import { useCallback, useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Niche } from "@/lib/admin/navigation";

type HistoryJob = {
  id: string;
  provider: "resend" | "instantly";
  sentAt: string | null;
  scheduledFor: string;
  email: string | null;
  step: string;
  status: string;
  providerId: string | null;
  triggeredBy: string | null;
};

type SequenceHistoryTabProps = {
  slug: string;
  niche: Niche;
  onSelectJob?: (job: HistoryJob) => void;
  refreshToken?: number;
};

function formatParisDateTime(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function SequenceHistoryTab({
  slug,
  niche,
  onSelectJob,
  refreshToken = 0,
}: SequenceHistoryTabProps) {
  const [jobs, setJobs] = useState<HistoryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ niche, days: "30" });
      const response = await fetch(
        `/api/admin/sequences/${slug}/history?${params.toString()}`,
      );
      const body = (await response.json()) as {
        jobs?: HistoryJob[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Historique indisponible");
      }
      setJobs(body.jobs ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Historique indisponible");
    } finally {
      setLoading(false);
    }
  }, [niche, slug]);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Chargement de l&apos;historique…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">30 derniers jours</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          Rafraîchir
        </Button>
      </div>

      {error ? <InternalStatusAlert variant="error" message={error} /> : null}

      {jobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun envoi sur cette période.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatParisDateTime(job.sentAt ?? job.scheduledFor)}
                  </TableCell>
                  <TableCell className="text-sm">{job.email ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{job.step}</TableCell>
                  <TableCell className="text-sm">{job.status}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {job.providerId ?? "—"}
                  </TableCell>
                  <TableCell>
                    {onSelectJob ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectJob(job)}
                      >
                        Logs
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
