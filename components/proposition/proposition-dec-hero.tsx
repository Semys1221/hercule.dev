import Link from "next/link";

import { HerculeLogo } from "@/components/conference/shared/HerculeLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PropositionDecHero() {
  return (
    <header className="flex flex-col items-center gap-6 text-center">
      <HerculeLogo size="md" showName />
      <Badge variant="secondary" className="tracking-[0.14em] uppercase">
        Essai gratuit 14 jours
      </Badge>
      <h1 className="max-w-3xl text-3xl font-light tracking-tight text-foreground sm:text-4xl">
        Hercule DEC — essai gratuit 14 jours pour cabinets restaurants
      </h1>
      <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
        Enregistrez votre carte, payez <strong className="font-medium text-foreground">0 €</strong>{" "}
        aujourd&apos;hui. Recevez{" "}
        <strong className="font-medium text-foreground">un rendez-vous visio</strong> avec un
        dirigeant restaurant qualifié. Continuez seulement si la qualité vous convainc.
      </p>
      <Button asChild size="lg">
        <Link href="#essai">Démarrer l&apos;essai gratuit</Link>
      </Button>
    </header>
  );
}
