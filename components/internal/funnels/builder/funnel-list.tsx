"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { funnelApiUrl } from "@/lib/admin/funnels/client";
import { funnelEditorHref } from "@/lib/admin/funnels/routing";
import type { FunnelScope, FunnelSummary } from "@/lib/admin/funnels/schema";

const createFormSchema = z.object({
  displayName: z.string().max(120).optional(),
});

type CreateFormValues = z.infer<typeof createFormSchema>;

type FunnelListProps = {
  scope: FunnelScope;
  navPath: string[];
  title: string;
};

export function FunnelList({ scope, navPath, title }: FunnelListProps) {
  const router = useRouter();
  const [funnels, setFunnels] = useState<FunnelSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createFormSchema),
    defaultValues: { displayName: "" },
  });

  const loadFunnels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(funnelApiUrl("", scope));
      const body = (await response.json()) as {
        funnels?: FunnelSummary[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Erreur de chargement");
      }
      setFunnels(body.funnels ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  useEffect(() => {
    void loadFunnels();
  }, [loadFunnels]);

  async function handleCreate(values: CreateFormValues) {
    setCreating(true);
    setError(null);
    try {
      const response = await fetch(funnelApiUrl("", scope), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audience: scope.audience,
          kind: scope.kind,
          stage: scope.stage,
          displayName: values.displayName?.trim() || undefined,
        }),
      });
      const body = (await response.json()) as {
        funnel?: { slug: string };
        error?: string;
      };
      if (!response.ok) {
        throw new Error(body.error ?? "Erreur de création");
      }
      setCreateOpen(false);
      form.reset({ displayName: "" });
      router.push(
        funnelEditorHref(navPath, body.funnel?.slug ?? "", { phase: "layout" }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  }

  async function handlePublish(slug: string) {
    setError(null);
    try {
      const response = await fetch(funnelApiUrl(`/${slug}/publish`, scope), {
        method: "POST",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Erreur de publication");
      }
      await loadFunnels();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">
            Briefs JSON locaux — 1 funnel publié max par dossier.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>New</Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Chargement…</p>
      ) : funnels.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun funnel</CardTitle>
            <CardDescription>
              Créez un funnel pour documenter le parcours. Cursor implémentera les pages
              client plus tard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOpen(true)}>New funnel</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {funnels.map((funnel) => (
            <Card key={funnel.slug}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{funnel.displayName}</CardTitle>
                  <Badge variant={funnel.status === "published" ? "default" : "secondary"}>
                    {funnel.status}
                  </Badge>
                </div>
                <CardDescription>
                  {funnel.stepCount} étape{funnel.stepCount === 1 ? "" : "s"} · {funnel.slug}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href={funnelEditorHref(navPath, funnel.slug, { phase: "layout" })}>
                    Éditer
                  </Link>
                </Button>
                {funnel.status !== "published" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handlePublish(funnel.slug)}
                  >
                    Publier
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau funnel</DialogTitle>
            <DialogDescription>
              Nom obligatoire. Laissez vide pour utiliser my_funnel_N automatiquement.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreate)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom du funnel</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="my_funnel_1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={creating}>
                  Créer et enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
