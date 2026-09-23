import { DecTrialCheckout } from "@/components/clients/dec-trial-checkout";

export function PropositionDecCta() {
  return (
    <section id="proposition-essai" className="flex w-full max-w-xl flex-col gap-6 scroll-mt-16">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Essai gratuit 14 jours
        </p>
        <h2 className="text-2xl font-light tracking-tight text-foreground">
          Démarrer maintenant
        </h2>
        <p className="text-sm text-muted-foreground">
          Paiement sécurisé Stripe — 0 € aujourd&apos;hui.
        </p>
      </div>
      <DecTrialCheckout />
    </section>
  );
}
