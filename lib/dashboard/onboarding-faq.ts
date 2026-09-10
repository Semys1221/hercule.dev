import type { DashboardFaqAudience } from "@/lib/dashboard/types";

export type OnboardingFaqItem = {
  id: string;
  q: string;
  a: string;
};

export type OnboardingFaqConfig = {
  subtitle: string;
  items: OnboardingFaqItem[];
  tieDown: string;
};

const AGENCE_FAQ: OnboardingFaqConfig = {
  subtitle: "Ce que nos partenaires agences nous demandent le plus souvent.",
  items: [
    {
      id: "ag-contrat-facture",
      q: "Quel contrat signé-je et comment suis-je facturé ?",
      a: "Votre souscription est régie par nos [Conditions générales de vente](/cvg). En validant votre commande, vous acceptez ce contrat. Vous recevrez une facture au nom de votre société (raison sociale, SIRET et adresse que vous indiquez lors de l'onboarding). Le montant affiché est le montant net — TVA non applicable, art. 293 B du CGI.",
    },
    {
      id: "ag-accompagnement",
      q: "Qui m'accompagne une fois le lancement effectué ?",
      a: "Hercule est un groupement d'entreprises dirigé par Evan, développeur senior. Evan vous accompagne personnellement lors de l'activation de votre compte et reste votre interlocuteur privilégié tout au long du service. L'équipe Hercule (qualification, produit, opérations) intervient en support au quotidien.",
    },
    {
      id: "ag-mise-en-relation",
      q: "Comment fonctionne la mise en relation ?",
      a: "Hercule vous attribue des contrats PME qualifiés selon vos critères d'éligibilité. Attribution exclusive. 0 % de commission sur vos ventes — vous facturez à vos tarifs.",
    },
    {
      id: "ag-paiement",
      q: "Comment se passe le paiement ?",
      a: "Paiement en deux fois : 50 % à la commande, 50 % à la livraison de votre compte de contrats PME sécurisés. Paiement sécurisé par Stripe.",
    },
    {
      id: "ag-delai-rdv",
      q: "Combien de temps avant mon premier RDV ?",
      a: "Premier RDV planifié sous 30 jours (paiement en 2 fois) ou sous 8 jours ouvrés (paiement intégral), dès validation de votre profil.",
    },
    {
      id: "ag-retard-livraison",
      q: "Que se passe-t-il si je n'ai pas le compte de rendez-vous prévu ?",
      a: "Selon nos [Conditions générales de vente](/cvg) (article 9), vous nous accordez un délai supplémentaire de **7 jours** en cas de retard de livraison (notamment en phase de montée en charge). Au-delà, nous vous invitons à nous écrire à contact@hercule.dev et à ne pas initier de dispute sur Stripe sans nous avoir contactés au préalable. Un règlement à l'amiable pourra être envisagé au cas par cas.",
    },
    {
      id: "ag-retractation",
      q: "Ai-je un délai de rétractation ?",
      a: "Oui. Après souscription, vous disposez de 4 jours calendaires pour vous rétracter par email à contact@hercule.dev, tant que votre service n'a pas encore démarré (Activation non effectuée). Passé ce délai ou après Activation, la commande est ferme. Détail : [CGV §8](/cvg).",
    },
    {
      id: "ag-noshow",
      q: "Mon prospect ne s'est pas présenté (no-show) — que se passe-t-il ?",
      a: "L'attribution n'est pas consommée. Signalez le no-show sous 48 h : un remplacement est planifié sous 14 jours ouvrés.",
    },
    {
      id: "ag-criteres",
      q: "Puis-je modifier mes critères d'éligibilité ?",
      a: "Oui. Contactez Evan ou l'équipe Hercule pour ajuster votre profil (spécialités, zone, capacité, tickets minimum) à tout moment.",
    },
  ],
  tieDown:
    "J'ai pris connaissance des [Conditions générales de vente](/cvg), le fonctionnement d'Hercule (attributions qualifiées, 0 % commission, obligation de moyens) me convient et je souhaite activer ma formule.",
};

const COMPTABLE_FAQ: OnboardingFaqConfig = {
  subtitle: "Ce que nos cabinets partenaires nous demandent le plus souvent.",
  items: [
    {
      id: "cp-contrat-facture",
      q: "Quel contrat signé-je et comment suis-je facturé ?",
      a: "Votre souscription est régie par les [Conditions générales de vente Hercule Comptable](/cvg/comptable). Vous recevrez une facture au nom de votre cabinet (raison sociale, SIRET et adresse indiqués lors de l'onboarding). Montant selon la formule choisie.",
    },
    {
      id: "cp-accompagnement",
      q: "Qui m'accompagne une fois le lancement effectué ?",
      a: "Hercule Comptable est porté par le groupement Hercule, dirigé par Evan, développeur senior. Evan vous accompagne lors de l'activation (Calendly Pro, Zoom Pro, premières missions) et reste disponible pour les points techniques. L'équipe intervient sur la qualification des demandes TPE et le suivi opérationnel.",
    },
    {
      id: "cp-mise-en-relation",
      q: "Comment fonctionne la mise en relation ?",
      a: "Hercule vous attribue des missions TPE qualifiées (tenue, fiscal, obligations administratives). Attribution exclusive au cabinet. 0 % de commission sur vos honoraires signés.",
    },
    {
      id: "cp-paiement",
      q: "Comment se passe le paiement ?",
      a: "Paiement intégral à la souscription via Stripe (Hercule Lite 998 €, Hercule Starter 1 499 €/mois, ou Pack 3 mois Starter 3 598 €). La commande est ferme dès acceptation des CGV et réception du paiement.",
    },
    {
      id: "cp-delai-rdv",
      q: "Combien de temps avant mon premier RDV dirigeant TPE ?",
      a: "Premier rendez-vous planifié sous 20 à 25 jours après activation, avec Calendly Pro et Zoom Pro provisionnés par Hercule.",
    },
    {
      id: "cp-retard-livraison",
      q: "Que se passe-t-il si je n'ai pas le compte de rendez-vous prévu ?",
      a: "Selon nos [Conditions générales de vente Hercule Comptable](/cvg/comptable) (article 9), vous nous accordez un délai supplémentaire de **7 jours** en cas de retard de livraison. Au-delà, nous vous invitons à nous écrire à contact@hercule.dev et à ne pas initier de dispute sur Stripe sans nous avoir contactés au préalable. Un règlement à l'amiable pourra être envisagé au cas par cas.",
    },
    {
      id: "cp-retractation",
      q: "Ai-je un délai de rétractation ?",
      a: "Oui. Après souscription, vous disposez de 4 jours calendaires pour vous rétracter par email à contact@hercule.dev, tant que votre service n'a pas encore démarré (Activation non effectuée). Vous pouvez renoncer à ce délai lors de l'onboarding ou à tout moment depuis votre dashboard pour lancer la recherche immédiatement. Passé ce délai ou après Activation, la commande est ferme. Détail : [CGV Comptable §8](/cvg/comptable).",
    },
    {
      id: "cp-garantie-mrr",
      q: "Y a-t-il une garantie si je ne signe pas de lettres de mission ?",
      a: "Hercule Starter et le Pack 3 mois incluent une garantie MRR : si le revenu récurrent cumulé issu des lettres de mission signées est inférieur au seuil contractuel, Hercule attribue des missions de remplacement. Hercule Lite n'inclut pas de garantie MRR — uniquement la garantie no-show.",
    },
    {
      id: "cp-noshow",
      q: "Mon prospect ne s'est pas présenté (no-show) — que se passe-t-il ?",
      a: "L'attribution n'est pas consommée. Remplacement planifié sous 14 jours ouvrés après signalement sous 48 h.",
    },
  ],
  tieDown:
    "J'ai pris connaissance des [Conditions générales de vente Hercule Comptable](/cvg/comptable), le fonctionnement du service (missions TPE qualifiées, 0 % commission, obligation de moyens) me convient et je souhaite activer ma formule.",
};

const ENTREPRISE_FAQ: OnboardingFaqConfig = {
  subtitle: "Ce que les dirigeants nous demandent avant de poursuivre leur recherche d'agence.",
  items: [
    {
      id: "en-gratuit",
      q: "Ce service est-il vraiment gratuit pour mon entreprise ?",
      a: "Oui. La qualification de votre besoin et la mise en relation avec une agence adaptée sont 100 % gratuites pour vous. Les agences partenaires financent le service Hercule. Hercule ne vous facture rien et ne prélève aucune commission.",
    },
    {
      id: "en-cadre",
      q: "Quel cadre encadre la mise en relation ?",
      a: "La mise en relation est encadrée par nos [Conditions générales](/cvg) entreprise. En poursuivant, vous autorisez Hercule à vous proposer une agence compatible avec votre besoin qualifié. Aucun engagement financier envers Hercule.",
    },
    {
      id: "en-accompagnement",
      q: "Qui m'accompagne dans ma recherche d'agence ?",
      a: "Hercule est un groupement d'entreprises dirigé par Evan. Votre besoin est d'abord qualifié par téléphone par l'équipe Hercule ; Evan supervise la compatibilité agence-projet. Vous gardez contact@hercule.dev pour toute question.",
    },
    {
      id: "en-selection",
      q: "Comment Hercule sélectionne mon agence ?",
      a: "Hercule évalue la compatibilité sur cinq critères : prestations, secteur, taille, tarifs et positionnement. Votre projet est validé en Live Qualification avant toute proposition d'agence.",
    },
    {
      id: "en-commission",
      q: "Dois-je payer une commission à Hercule après mon RDV ?",
      a: "Non. Aucun upsell, aucune commission, aucun frais caché. La négociation et la facturation se font directement avec l'agence que vous rencontrez.",
    },
    {
      id: "en-rdv",
      q: "Comment réserver mon RDV avec l'agence proposée ?",
      a: "Lorsqu'une agence compatible vous est proposée, vous recevez un email avec un lien Calendly pour choisir votre créneau. La réservation se fait depuis cet email.",
    },
  ],
  tieDown:
    "J'ai compris que le service Hercule est gratuit pour mon entreprise, je souhaite poursuivre ma recherche d'agence.",
};

const FAQ_BY_AUDIENCE: Record<DashboardFaqAudience, OnboardingFaqConfig> = {
  agence: AGENCE_FAQ,
  comptable: COMPTABLE_FAQ,
  entreprise: ENTREPRISE_FAQ,
};

export function getOnboardingFaq(audience: DashboardFaqAudience): OnboardingFaqConfig {
  return FAQ_BY_AUDIENCE[audience];
}

export function onboardingFaqToDashboardItems(
  config: OnboardingFaqConfig,
): { q: string; a: string }[] {
  return config.items.map((item) => ({ q: item.q, a: item.a }));
}
