import { cn } from "@/lib/utils";

type TimelineStep = {
  id: string;
  when: string;
  title: string;
  body: string;
};

const STEPS: TimelineStep[] = [
  {
    id: "signup",
    when: "J0",
    title: "Inscription",
    body: "Vous validez l'essai gratuit 14 jours : carte enregistrée, aucun prélèvement.",
  },
  {
    id: "onboarding",
    when: "J1–3",
    title: "Onboarding",
    body: "Vous indiquez votre lien Calendly ; nous paramétrons la qualification restaurants.",
  },
  {
    id: "rdv",
    when: "Sous 7 j",
    title: "Premier rendez-vous",
    body: "Un dirigeant restaurant (rentabilité, coûts, ratio matière) en visio avec vous.",
  },
  {
    id: "trial",
    when: "14 jours",
    title: "Pendant l'essai",
    body: "Vous jugez la qualité du profil et du processus Hercule.",
  },
  {
    id: "cancel",
    when: "Avant J14",
    title: "Annulation possible",
    body: "Via le portail Stripe : vous arrêtez, pas de mensualité.",
  },
  {
    id: "after",
    when: "Après J14",
    title: "Abonnement",
    body: "Si vous continuez : 1 499 €/mois, 10 rendez-vous qualifiés par mois.",
  },
];

function TimelineTrack() {
  const total = STEPS.length;
  return (
    <div className="flex w-full items-center" aria-hidden>
      {STEPS.map((_, index) => (
        <div key={index} className="flex flex-1 items-center last:flex-none">
          <span className="size-2.5 shrink-0 rounded-full border border-foreground bg-foreground" />
          {index < total - 1 ? <span className="h-px w-full bg-foreground/40" /> : null}
        </div>
      ))}
    </div>
  );
}

export function PropositionTrialTimeline() {
  return (
    <section className="flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">
          Chronologie
        </p>
        <h2 className="text-xl font-light tracking-tight text-foreground">
          Ce qui se passe, étape par étape
        </h2>
      </div>
      <TimelineTrack />
      <ol className="flex flex-col gap-6">
        {STEPS.map((step) => (
          <li key={step.id} className="grid gap-2 sm:grid-cols-[4rem_1fr] sm:gap-4">
            <p
              className={cn(
                "text-[11px] tracking-[0.16em] text-muted-foreground uppercase sm:text-right",
              )}
            >
              {step.when}
            </p>
            <div className="flex flex-col gap-1">
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
