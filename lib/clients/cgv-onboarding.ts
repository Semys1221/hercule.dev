import type {
  ConferenceBilling,
  ConferenceClientType,
} from "@/lib/commercial/conference-pricing";
import { CONFERENCE_CLIENT_TYPES } from "@/lib/commercial/conference-pricing";

export const CLIENT_CGV_VERSION = "2026-09-23";

export function guaranteeMonthsLabel(billing: ConferenceBilling): string {
  return billing === "monthly" ? "1 mois" : "3 mois";
}

export function clientCgvHighlights(params: {
  clientType: ConferenceClientType;
  secondaryVertical: "ias" | null;
  billing: ConferenceBilling;
  startNow: boolean;
  rdvTotal: number;
}): Array<{ title: string; body: string }> {
  const months = guaranteeMonthsLabel(params.billing);
  const showIas =
    params.clientType === CONFERENCE_CLIENT_TYPES.ias ||
    params.secondaryVertical === "ias";
  const showCif = params.clientType === CONFERENCE_CLIENT_TYPES.cif;
  const showDec = params.clientType === CONFERENCE_CLIENT_TYPES.dec;

  const items: Array<{ title: string; body: string }> = [
    {
      title: params.startNow ? "Vous démarrez maintenant" : "Vous gardez 4 jours",
      body: params.startNow
        ? `La rétractation de 4 jours est remplacée par une garantie de ${months} de service offert.`
        : "Vous pouvez encore changer d'avis pendant 4 jours (contact@hercule.dev), tant que le service n'a pas démarré.",
    },
    {
      title: `Garantie ${months}`,
      body: `Si vos ${params.rdvTotal} rendez-vous ne sont pas livrés entre J+1 et J+60, on prolonge le service de ${months}, sans frais.`,
    },
  ];

  if (showDec) {
    items.push({
      title: "Votre filtre",
      body: "Restaurants indépendants, au moins 3 salariés, BIC.",
    });
  }
  if (showIas) {
    items.push({
      title: "Votre exercice IAS",
      body: "Vous confirmez un exercice de plus de 30 000 €, obtenu par téléphone, SMS, formulaire ou email.",
    });
  }
  if (showCif) {
    items.push({
      title: "Votre exercice CIF",
      body: "Vous confirmez un exercice de plus de 50 000 €, obtenu par téléphone, SMS, formulaire ou email.",
    });
  }

  items.push({
    title: "Absent au rendez-vous",
    body: "S'il ne vient pas malgré la relance de la veille, le crédit revient et on replanifie sous 14 jours ouvrés. Dites-le-nous sous 48 h.",
  });

  return items;
}

/** Plain-text CGV body for the onboarding scroll (canon 2026-09-23). */
export const CLIENT_CGV_BODY = `Conditions Générales de Vente — Hercule
Version : 2026-09-23
Prestataire : Hercule — groupement d'entrepreneurs dirigé par Evan Sinclair
Contact : contact@hercule.dev · Mentions : hercule.dev/mentions-legales

Les présentes CGV s'appliquent aux formules partenaires Hercule Mercantile (DEC — Expert-Comptable) et Hercule Hubris (IAS — Courtier assurance · CIF — Conseiller Financier). Elles prévalent sur tout document contradictoire du Client, sauf dérogation écrite.

1. Définitions communes

Attribution / crédit — Mise à disposition exclusive d'une demande qualifiée, avec planification d'un RDV dans l'agenda du Client.
Crédit consommé — RDV planifié dans l'agenda du Client. No-show → recrédit (art. 6).
RDV honoré — Présence du dirigeant ≥ 15 minutes en visioconférence.
Activation — Démarrage du service après paiement et onboarding.
Live Qualification — Validation Hercule du besoin et de la compatibilité avant attribution.
Bilan lourd — Demande qualifiée à fort enjeu patrimonial ou social (PME BTP ou BNC médicaux), attribuée dans le cadre Hercule Hubris.

2. Prestations

Hercule fournit une infrastructure de mise en relation B2B et de reconfiguration de statut : capture d'intention, qualification live, attribution exclusive, kit prévente, provisionnement Calendly Pro et Zoom Pro.

Hercule s'engage sur une obligation de moyens (volume de crédits + qualification). Aucune garantie de signature, de MRR ou de commission upfront.

Les dirigeants mis en relation ne paient aucune commission à Hercule. Hercule prélève 0 % sur les honoraires / commissions produits du Client.

Tous les échanges sont en visioconférence nationale (France). Hercule ne garantit pas d'échanges régionaux ou en présentiel.

3. Formules et tarifs

Prix en euros. Franchise en base de TVA (art. 293 B CGI).

3.1 Hercule Mercantile — Expert-Comptable (DEC)
Prix : 1 499 €
Durée : 1 mois
Crédits : 10 rendez-vous qualifiés garantis
Période de test : 30 jours
Garantie complémentaire : si les RDV du quota ne sont pas livrés entre J+1 et J+60, prolongation sans frais de 1 mois (mensuel) ou 3 mois (pack)
Filtre garanti : Restaurants indépendants +3 salariés · BIC
Garantie signature / MRR : Aucune

3.2 Hercule Hubris — IAS + CIF
Remplace les anciennes offres listées seules IAS (1 999 €/mois) et CIF (3 499 €/90 j).
Option A — Choix de l'Élite : 4 000 € flat (pack trimestriel global upfront)
Option B — Flux Fractionné : 1 800 € / mois · engagement 3 mois
Volume : 15 à 20 bilans lourds / trimestre
Filtre garanti : PME BTP 3–15 salariés ou BNC médicaux à forte trésorerie dormante
Niches couvertes : IAS (courtage / PME bâtiment) · CIF (chirurgiens-dentistes / BNC médicaux)
Garantie signature / commissions : Aucune

4. Paiement et facturation

Commande ferme dès acceptation des CGV et réception du paiement (Stripe ou virement).

Hercule Mercantile : paiement unique ou abonnement Stripe pour 1 mois à 1 499 € ; pas de reconduction tacite sauf renouvellement explicite du Client.
Hercule Hubris Option A : paiement intégral 4 000 € à la souscription.
Hercule Hubris Option B : facturation mensuelle 1 800 € pendant l'engagement de 3 mois.
Impayé > 7 jours : suspension possible.

5. Rétractation

Client professionnel — droit de rétractation consommateur non applicable.

Politique commerciale : 4 jours calendaires après souscription pour se rétracter (email contact@hercule.dev), tant que l'Activation n'a pas démarré.

À l'onboarding, le Client peut choisir de démarrer tout de suite. Ce choix remplace ces 4 jours par la garantie de prolongation : 1 mois de service offert sur une formule mensuelle, 3 mois sur un pack.

6. Délais, no-show et garanties opérationnelles

Accès onboarding après paiement : 48 heures
Remplacement no-show : 14 jours ouvrés
Signalement no-show : sous 48 h
Grâce retard livraison : 7 jours — contacter contact@hercule.dev avant dispute Stripe

No-show (prospect absent malgré relance H-24) : crédit recrédité ; remplacement planifié sous 14 jours ouvrés.

Garantie de prolongation : si les rendez-vous du quota ne sont pas livrés entre J+1 et J+60 après activation, Hercule prolonge le service sans frais — 1 mois pour une formule mensuelle, 3 mois pour un pack.

Quota : celui de la formule souscrite (Hercule Mercantile : 10 rendez-vous qualifiés en mensuel, 30 en pack ; Hercule Hubris : quota indiqué à la souscription).

Attestation de volume (IAS et CIF)

En IAS, le Client confirme explicitement un exercice supérieur à 30 000 €, obtenu par téléphone, SMS, formulaire ou email.
En CIF, le Client confirme explicitement un exercice supérieur à 50 000 €, obtenu par les mêmes canaux.
Un Client CIF + IAS confirme les deux seuils.

Warm-up technique (~14 j) et premiers créneaux visibles (J+15) sont communiqués après paiement (email protocole) — jamais sur slide prix / checkout.

7. Obligations du Client

1. Compléter l'onboarding sous 48 h ;
2. Maintenir Calendly provisionné à jour ;
3. Honorer les RDV ou annuler avec 24 h de préavis ;
4. Ne pas contourner Hercule pendant la période de service et 12 mois après la dernière Attribution ;
5. Confidentialité des informations dirigeants ;
6. Payer aux échéances.

8. Durée et résiliation

Hercule Mercantile : durée initiale 1 mois ; fin de service à l'échéance sauf renouvellement explicite.
Hercule Hubris : jusqu'à échéance du trimestre (Option A) ou des 3 mensualités (Option B) ; reconduction tacite sauf résiliation.
Suspension sans préavis si impayé > 7 j ou manquement grave.
Crédits non consommés supprimés à la résiliation (pas de conversion cash).

9. Responsabilité et données

Responsabilité totale de Hercule limitée aux montants payés sur les 12 derniers mois. Pas de responsabilité sur dommages indirects ni résultat commercial des RDV.

Droit français. Tribunaux du ressort du siège.

Traitement RGPD — contact@hercule.dev — politique de confidentialité.

Document complet : hercule.dev/cvg`;
