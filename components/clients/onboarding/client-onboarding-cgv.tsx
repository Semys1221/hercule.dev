"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CLIENT_CGV_BODY,
  CLIENT_CGV_FREE_TRIAL_BODY,
  CLIENT_CGV_FREE_TRIAL_VERSION,
  CLIENT_CGV_VERSION,
  clientCgvHighlights,
  clientFreeTrialCgvHighlights,
} from "@/lib/clients/cgv-onboarding";
import type { ClientDashboardData } from "@/lib/clients/types";

type ClientOnboardingCgvProps = {
  data: ClientDashboardData;
  startNow: boolean;
  saving: boolean;
  error: string | null;
  onAccept: () => void;
  variant?: ClientDashboardData["onboardingVariant"];
};

export function ClientOnboardingCgv({
  data,
  startNow,
  saving,
  error,
  onAccept,
  variant = "standard",
}: ClientOnboardingCgvProps) {
  const freeTrial = variant === "dec_free_trial";
  const highlights = freeTrial
    ? clientFreeTrialCgvHighlights()
    : clientCgvHighlights({
        clientType: data.clientType,
        secondaryVertical: data.secondaryVertical,
        billing: data.billing,
        startNow,
        rdvTotal: data.rdvTotal,
      });
  const cgvVersion = freeTrial ? CLIENT_CGV_FREE_TRIAL_VERSION : CLIENT_CGV_VERSION;
  const cgvBody = freeTrial ? CLIENT_CGV_FREE_TRIAL_BODY : CLIENT_CGV_BODY;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div>
        <p className="text-sm text-muted-foreground">
          Conditions générales · version {cgvVersion}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          Voici comment on travaille ensemble
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Version courte d&apos;abord, texte complet ensuite. Acceptez pour
          ouvrir votre espace.
        </p>
      </div>

      <ul className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
        {highlights.map((item) => (
          <li key={item.title} className="text-sm">
            <p className="font-medium text-foreground">{item.title}</p>
            <p className="mt-0.5 text-muted-foreground">{item.body}</p>
          </li>
        ))}
      </ul>

      <ScrollArea className="h-[min(55vh,28rem)] rounded-lg border border-border">
        <pre className="whitespace-pre-wrap px-4 py-4 font-sans text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {cgvBody}
        </pre>
      </ScrollArea>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="sticky bottom-0 border-t border-border bg-background pt-4">
        <Button
          type="button"
          className="w-full"
          disabled={saving}
          onClick={onAccept}
        >
          {saving
            ? "Enregistrement…"
            : "J'accepte les conditions d'utilisation"}
        </Button>
      </div>
    </div>
  );
}
