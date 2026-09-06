"use client";

import { useState } from "react";

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
import { toast } from "@/hooks/use-toast";

type NoShowDialogProps = {
  slug: string;
};

export function NoShowDialog({ slug }: NoShowDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      const response = await fetch(
        `/api/dashboard/${encodeURIComponent(slug)}/noshow`,
        { method: "POST" },
      );
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof body.error === "string" ? body.error : "Échec de l'envoi du signalement",
        );
      }

      toast({
        title: "Signalement envoyé",
        description:
          "Notre équipe a été notifiée. Vous recevrez une confirmation par email.",
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Impossible d'envoyer le signalement",
        description:
          error instanceof Error ? error.message : "Une erreur est survenue.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          Signaler un problème
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Signaler un problème de rendez-vous ?</AlertDialogTitle>
          <AlertDialogDescription>
            Utilisez cette action si une entreprise ne s&apos;est pas présentée à un
            rendez-vous ou si vous rencontrez un problème lié à une livraison. Notre
            équipe sera notifiée et vous recevrez un email de confirmation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={submitting}
            onClick={(event) => {
              event.preventDefault();
              void handleConfirm();
            }}
          >
            {submitting ? "Envoi…" : "Confirmer le signalement"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
