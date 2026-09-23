"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import type { ClientRow } from "@/lib/clients/types";

type EnginClientDeleteCardProps = {
  client: ClientRow;
};

export function EnginClientDeleteCard({ client }: EnginClientDeleteCardProps) {
  const router = useRouter();
  const [confirmSlug, setConfirmSlug] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const slugMatches = confirmSlug.trim() === client.slug;

  async function handleDelete() {
    if (!slugMatches || deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/engin/clients/${client.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Suppression impossible");
      }
      toast({
        title: "Client supprimé",
        description: `${client.email} a été retiré définitivement.`,
      });
      router.push("/admin");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Suppression impossible",
        description: error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle>Zone de danger</CardTitle>
        <CardDescription>
          Suppression définitive en base (paiements, RDV, siège Calendly, jobs email, tâches).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Supprimer définitivement</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer ce client ?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{client.email}</span>{" "}
                    (<code className="text-xs">{client.slug}</code>)
                  </p>
                  <label className="text-foreground" htmlFor="confirm-slug-delete">
                    Saisissez le slug <code className="text-xs">{client.slug}</code>
                  </label>
                  <Input
                    id="confirm-slug-delete"
                    value={confirmSlug}
                    onChange={(event) => setConfirmSlug(event.target.value)}
                    autoComplete="off"
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                disabled={!slugMatches || deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(event) => {
                  event.preventDefault();
                  void handleDelete();
                }}
              >
                {deleting ? "Suppression…" : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
