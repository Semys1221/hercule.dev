"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ_ITEMS = [
  {
    id: "free",
    question: "C'est vraiment gratuit pendant 14 jours ?",
    answer:
      "Oui. Aucun prélèvement tant que vous annulez avant la fin de la période d'essai. La carte sert uniquement à enregistrer l'abonnement pour la suite si vous poursuivez.",
  },
  {
    id: "rdv",
    question: "Combien de rendez-vous pendant l'essai ?",
    answer:
      "Un rendez-vous visio qualifié avec un dirigeant restaurant — suffisant pour juger la qualité des profils et du processus.",
  },
  {
    id: "after",
    question: "Que se passe-t-il si je n'annule pas ?",
    answer:
      "À la fin des 14 jours, l'abonnement à 1 499 €/mois démarre, avec 10 rendez-vous qualifiés sur le mois (offre DEC).",
  },
  {
    id: "cancel",
    question: "Comment annuler ?",
    answer:
      "Depuis le portail de facturation Stripe, accessible dans l'email de confirmation et votre tableau de bord client.",
  },
  {
    id: "who",
    question: "Quel type de restaurants ?",
    answer:
      "Dirigeants avec enjeux de rentabilité, pilotage des coûts et ratio matière — profils qualifiés avant transmission.",
  },
  {
    id: "case",
    question: "Les chiffres du case study sont-ils garantis pour moi ?",
    answer:
      "Non : ils illustrent un déploiement type. L'essai gratuit 14 jours est fait pour valider chez vous la qualité des rendez-vous avant engagement.",
  },
] as const;

export function PropositionDecFaq() {
  return (
    <section className="flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2 text-center">
        <p className="text-xs tracking-[0.22em] text-muted-foreground uppercase">FAQ</p>
        <h2 className="text-xl font-light tracking-tight text-foreground">Essai DEC</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {FAQ_ITEMS.map((item) => (
          <AccordionItem key={item.id} value={item.id}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
