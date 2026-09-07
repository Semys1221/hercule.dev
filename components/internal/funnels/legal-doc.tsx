"use client";

import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { InternalStatusAlert } from "@/components/internal/funnels/ui/internal-status-alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { LegalDocType } from "@/lib/admin/legal-preview";
import type { Audience } from "@/lib/admin/navigation";

type FunnelLegalDocProps = {
  audience: Audience;
  docType: LegalDocType;
  label: string;
};

type ViewMode = "edit" | "preview";

function LegalDocSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[60vh] w-full" />
      </CardContent>
    </Card>
  );
}

export function FunnelLegalDoc({ audience, docType, label }: FunnelLegalDocProps) {
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("edit");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/legal/${audience}/${docType}`);
      const body = (await response.json()) as { markdown?: string; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Chargement impossible");
      }
      setMarkdown(body.markdown ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [audience, docType]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/legal/${audience}/${docType}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const body = (await response.json()) as { markdown?: string; error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Enregistrement impossible");
      }
      setMarkdown(body.markdown ?? markdown);
      setSuccess("Document enregistré.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LegalDocSkeleton />;
  }

  return (
    <div className="space-y-4">
      {error && <InternalStatusAlert variant="error" message={error} />}
      {success && <InternalStatusAlert variant="success" message={success} />}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <CardTitle>{label}</CardTitle>
            <CardDescription>
              Source : <code>doc/tech-stack/</code> — synchronisé avec le site public.
            </CardDescription>
          </div>
          <ToggleGroup
            type="single"
            value={viewMode}
            onValueChange={(value) => {
              if (value === "edit" || value === "preview") {
                setViewMode(value);
              }
            }}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem value="edit">Édition</ToggleGroupItem>
            <ToggleGroupItem value="preview">Aperçu</ToggleGroupItem>
          </ToggleGroup>
        </CardHeader>
        <CardContent>
          {viewMode === "edit" ? (
            <Textarea
              value={markdown}
              onChange={(event) => setMarkdown(event.target.value)}
              className="min-h-[60vh] font-mono text-sm"
              spellCheck={false}
            />
          ) : (
            <div className="prose prose-neutral max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void load()} disabled={saving}>
            Recharger
          </Button>
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
