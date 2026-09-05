export type AgenceFaqEntry = {
  question: string
  answer: string
  cvgLink?: boolean
}

export const AGENCE_FAQ: AgenceFaqEntry[] = [
  {
    question: "Où en est ma recherche de clients ?",
    answer:
      "Votre page de suivi affiche la progression de votre recherche étape par étape. Chaque jalon correspond à une phase du service Hercule (activation, qualification, proposition de mise en relation, rendez-vous planifiés). Les mises à jour par email suivent le calendrier défini lors de votre onboarding.",
  },
  {
    question: "D'où viennent les demandes clients ?",
    answer:
      "Hercule détecte en continu des signaux d'intention sur plus de 1 000 sites : recrutements, développements, changements d'activité, etc. Les entreprises sont qualifiées par Hercule (besoin, budget, attentes). Une fois confirmées, les demandes rejoignent notre réseau et sont proposées à l'agence la plus compatible.",
  },
  {
    question: "Comment Hercule choisit-il les attributions ?",
    answer:
      "Hercule évalue la compatibilité client-agence sur cinq critères : prestations, secteur d'excellence, taille, tarifs et positionnement. Objectif : aligner budget, structure et mode d'accompagnement.",
  },
  {
    question: "Que se passe-t-il quand une entreprise me est proposée ?",
    answer:
      "Votre statut passe en « proposition de match ». Vous recevez un email avec les informations de l'entreprise. La réservation du rendez-vous se fait via le lien Calendly dans cet email — pas depuis cette page.",
  },
  {
    question: "Combien coûte Hercule ?",
    answer:
      "Starter : 1 489 € pour 5 attributions qualifiées. Hercule récurrent : 2 500 €/mois — jusqu'à 4 clients signés par mois. Hercule qualifie et signe ses propres contrats déjà disponibles pour votre agence, à vos tarifs (0 % commission). Offre éligible sur profil uniquement, proposée après validation de compatibilité. 0 % de commission sur vos ventes.",
    cvgLink: true,
  },
  {
    question: "Ai-je un délai de rétractation ?",
    answer: "Oui. Après souscription, vous disposez d'un délai de 4 jours calendaires pour vous rétracter.",
    cvgLink: true,
  },
  {
    question: "Comment fonctionnent les emails Hercule ?",
    answer:
      "Hercule utilise plusieurs adresses et domaines dédiés à ses différentes communications. Le domaine principal de la société et de la plateforme est hercule.dev.",
  },
  {
    question: "Mon prospect ne s'est pas présenté (no-show)",
    answer:
      "L'attribution n'est pas consommée. Un rendez-vous de remplacement est planifié sous 14 jours ouvrés.",
    cvgLink: true,
  },
  {
    question: "Que signifie une demande visible sur hercule.dev ?",
    answer:
      "Chaque demande affichée correspond à un accord déjà obtenu avec le dirigeant. Un mandat de délégation a été signé pour une date cible (ex. novembre). Les dirigeants qui anticipent planifient leur acquisition marketing à l'avance.",
    cvgLink: true,
  },
  {
    question: "Comment planifier les demandes à l'avance ?",
    answer:
      "Les demandes sont organisées par fenêtres calendaires (septembre–novembre). Une carte visible indique une intention confirmée pour la période affichée, pas une simple piste non qualifiée.",
    cvgLink: true,
  },
  {
    question: "Comment se passe ma mise en relation ?",
    answer:
      "Une fois votre fiche agence complétée, les dirigeants éligibles dont la demande entre dans la timeframe du mois reçoivent un email de proposition. Comptez environ 6 jours ouvrés pour voir le premier RDV dans votre agenda.",
    cvgLink: true,
  },
]
