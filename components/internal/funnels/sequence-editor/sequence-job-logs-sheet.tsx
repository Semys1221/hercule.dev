"use client";

import { useEffect, useState } from "react";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

type SequenceJobLogsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string | null;
  provider: "resend" | "instantly";
};

export function SequenceJobLogsSheet({
  open,
  onOpenChange,
  jobId,
  provider,
}: SequenceJobLogsSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<string>("");
  const [resendId, setResendId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !jobId) {
      return;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ provider });
        const response = await fetch(
          `/api/admin/sequences/jobs/${jobId}?${params.toString()}`,
        );
        const body = (await response.json()) as { job?: Record<string, unknown>; error?: string };
        if (!response.ok) {
          throw new Error(body.error ?? "Job introuvable");
        }
        if (!cancelled) {
          const job = body.job ?? {};
          setPayload(JSON.stringify(job, null, 2));
          const id =
            typeof job.resend_email_id === "string" ? job.resend_email_id.trim() : "";
          setResendId(id || null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Job introuvable");
          setPayload("");
          setResendId(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [jobId, open, provider]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Logs job</SheetTitle>
          <SheetDescription>
            Détail brut du job {provider} {jobId ? `#${jobId.slice(0, 8)}` : ""}
          </SheetDescription>
        </SheetHeader>

        {error ? <InternalStatusAlert variant="error" message={error} /> : null}

        {loading ? (
          <Skeleton className="mt-4 h-48 w-full" />
        ) : (
          <div className="mt-4 space-y-4">
            {resendId ? (
              <Button type="button" variant="outline" size="sm" asChild>
                <a
                  href={`https://resend.com/emails/${resendId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir dans Resend
                </a>
              </Button>
            ) : null}
            <pre className="max-h-[60vh] overflow-auto rounded-md border bg-muted/30 p-4 text-xs">
              {payload || "—"}
            </pre>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
