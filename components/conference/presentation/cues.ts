/**
 * Cues de présentation — guidance pour chaque beat.
 *
 * Indexées par scène puis par step : déplacer une scène dans `beats.ts`
 * ne décale plus les libellés des autres scènes.
 *
 *   label  : nom court du beat (HUD, navigateur, « suivant »)
 *   phrase : ce que le présentateur dit AVANT d'appuyer sur Espace
 */

import type { SceneId } from "./types";

export type Cue = {
  label: string;
  phrase?: string;
};

export const CUES: Record<SceneId, Cue[]> = {
  S01_Intro: [
    { label: "Noir", phrase: "(silence d'ouverture)" },
    { label: "Trois marchés", phrase: "Comptabilité, courtage, assurance…" },
    { label: "Evan", phrase: "Je m'appelle Evan, voilà Hercule." },
    { label: "Cabinet", phrase: "Le cabinet." },
  ],

  S03_5_StartingPoint: [
    { label: "Point de départ", phrase: "Commençons par le bon point de départ." },
  ],

  S02_WordOfMouth: [
    { label: "Bouche-à-oreille — titre", phrase: "Commençons par le début : le bouche-à-oreille." },
    { label: "Confiance", phrase: "Ça fonctionne parce que la confiance se transfère." },
    { label: "Réseau", phrase: "Et ça crée un réseau organique." },
  ],

  S03_WOMProblem: [
    { label: "Rupture", phrase: "(pause)" },
    { label: "Volume ?", phrase: "Combien de recommandations par mois ?" },
    { label: "Moment ?", phrase: "Et quand exactement ?" },
    { label: "Profil ?", phrase: "Et quel profil ?" },
    { label: "Cube mélangé", phrase: "C'est un système incohérent." },
  ],

  S03_6_BuildAudience: [
    { label: "Fiche de leads", phrase: "Alors certains achètent des listes." },
  ],

  S04_ColdLeads: [
    { label: "Personne n'a demandé", phrase: "Ces gens n'ont rien demandé." },
    { label: "Relances", phrase: "Appel, relance, relance…" },
    { label: "Profil ✕ ✕ ✕", phrase: "Et le profil ne correspond pas." },
  ],

  S05_GoogleAds: [
    { label: "Google Ads", phrase: "Alors… et si c'était eux qui venaient à vous ?" },
    { label: "Téléphone sonne", phrase: "Avec Google Ads, le téléphone sonne." },
    { label: "Qui entre ?", phrase: "Mais qui appelle ?" },
    { label: "Entonnoir", phrase: "Et l'entonnoir est brutal." },
  ],

  S06_Reframing: [
    { label: "Découragement", phrase: "(pause) Aucune de ces approches ne résout le vrai problème." },
    { label: "Volume / Qualité / Intérêt", phrase: "Volume, qualité, intérêt." },
    { label: "Silence ?", phrase: "Lequel des trois manque selon vous ?" },
    { label: "Cube mélangé", phrase: "(silence)" },
  ],

  S07_ThreeSolutions: [
    { label: "Bouche-à-oreille — bilan", phrase: "Le bouche-à-oreille donne de l'intérêt. Mais pas de volume." },
    { label: "Leads — bilan", phrase: "Les leads donnent du volume et de la qualité. Mais pas d'intérêt." },
    { label: "Ads — bilan", phrase: "Google Ads donne du volume et de l'intérêt. Mais pas de qualité." },
  ],

  S08_Mechanism: [
    { label: "Flux VOLUME→INTÉRÊT", phrase: "Un système qui produit du volume qualifié avec intérêt." },
  ],

  S09_R2Reveal: [
    { label: "Cube → Logo", phrase: "Ce système, on l'appelle…" },
    { label: "HERCULE R2", phrase: "Hercule R2." },
    { label: "Audience — Volume", phrase: "Première étape : le volume." },
    { label: "Liste de pros", phrase: "Nous identifions une large liste de professionnels." },
    { label: "Profils cibles", phrase: "BNC, BIC, TNS — ou tout autre profil." },
    { label: "Le terrain", phrase: "À ce stade, on construit le volume. Pas encore le filtre." },
    { label: "FILTRE — Qualification", phrase: "Deuxième étape : la qualification." },
    { label: "Contact", phrase: "Nous prenons contact avec les professionnels identifiés." },
    { label: "Trois grilles", phrase: "On ne pose pas les mêmes questions à tout le monde." },
    { label: "DEC — suivi", phrase: "Comment se passe le suivi financier du restaurant ?" },
    { label: "DEC — marges", phrase: "Pas de pilotage des marges, on veut le mettre en place." },
    { label: "DEC — pilotage", phrase: "Un accompagnement au-delà de la comptabilité ?" },
    { label: "DEC — confirmation", phrase: "Quelqu'un qui pilote avec nous, pas un prestataire de plus." },
    { label: "DEC — 300 €", phrase: "Un accompagnement à 300 € par mois minimum, est-ce acceptable ?" },
    { label: "DEC — ROI", phrase: "Si le ROI est démontré, c'est ce que nous recherchons." },
    { label: "DEC — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?" },
    { label: "DEC — créneau", phrase: "Le 7 à 10h, je ne peux pas. Lundi à 13h ?" },
    { label: "DEC — qualifié", phrase: "Prospect qualifié : solvable + pilotage." },
    { label: "IAS — assurance", phrase: "Avez-vous des besoins en assurance pour l'entreprise ?" },
    { label: "IAS — besoins", phrase: "RC pro et locaux. Il faut remettre les contrats à niveau." },
    { label: "IAS — trésorerie", phrase: "Plus de 50 000 € de trésorerie ?" },
    { label: "IAS — 80 k€", phrase: "Autour de 80 000 €, on peut avancer." },
    { label: "IAS — contrats", phrase: "Les contrats ont-ils été réévalués récemment ?" },
    { label: "IAS — activité", phrase: "Rien n'a été repris, ça ne correspond plus." },
    { label: "IAS — couverture", phrase: "Ouvert à faire le point sur les garanties ?" },
    { label: "IAS — accord", phrase: "Des garanties à jour, pas un devis pour le principe." },
    { label: "IAS — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?" },
    { label: "IAS — lien", phrase: "D'accord pour le 7. Envoyez le lien de la visio." },
    { label: "IAS — qualifié", phrase: "Prospect qualifié : 50 k€ + besoin d'assurance." },
    { label: "CIF — impôt", phrase: "Avez-vous une idée du montant d'impôt que vous payez ?" },
    { label: "CIF — impôt vu", phrase: "On le voit chaque année, on ne sait pas quoi en faire." },
    { label: "CIF — 50 k€", phrase: "Un minimum de 50 000 € pour activer des leviers ?" },
    { label: "CIF — 100 k€", phrase: "Environ 100 000 €. Une proposition sérieuse." },
    { label: "CIF — leviers", phrase: "Étudier les leviers adaptés avant de décider ?" },
    { label: "CIF — confirmation", phrase: "Oui. Je veux être accompagné pour trancher." },
    { label: "CIF — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?" },
    { label: "CIF — créneau", phrase: "Le 7 à 10h, je suis pris. Lundi à 13h ?" },
    { label: "CIF — qualifié", phrase: "Prospect qualifié : 50 k€ + leviers identifiés." },
    { label: "Logo R2", phrase: "Voilà le système dans son ensemble." },
    { label: "Courtage de projet", phrase: "Courtage de projet BNC, BIC, TNS. Patience et expertise métier." },
  ],

  S10_JohnDemo: [
    { label: "30 jours", phrase: "Deux rendez-vous par semaine." },
    { label: "25–30 rendez-vous", phrase: "Sur 4 mois : 25 à 30 rendez-vous." },
  ],

  S13_HerculeDEC: [
    { label: "Restaurant", phrase: "Première offre : Hercule DEC. Prenons un restaurant." },
    { label: "Leur problème", phrase: "Le chiffre d'affaires monte. La marge se contracte." },
    { label: "Pourquoi ils changent", phrase: "Le cabinet actuel ne traite pas ça." },
    { label: "Ce que vous apportez", phrase: "Ratio matière, pilotage, coûts, rentabilité." },
    { label: "Budget 300 €", phrase: "300 euros par mois." },
    { label: "10 rendez-vous", phrase: "10 rendez-vous qualifiés par mois." },
    { label: "5 signatures", phrase: "5 signatures. 50 % de conversion." },
    { label: "1 500 € / mois", phrase: "1 500 euros de revenus récurrents par mois." },
    { label: "Mois 1", phrase: "1 500 euros de CA pour un mois." },
    { label: "Mois suivants", phrase: "4 500 euros au deuxième mois. 9 000 euros cumulés sur 3 mois." },
    { label: "Prix 1 499 €", phrase: "1 499 euros par mois." },
  ],

  S14_HerculeCourtage: [
    { label: "Médecin", phrase: "Deuxième offre : Hercule Courtage. Prenons un médecin." },
    { label: "Pression fiscale", phrase: "Les revenus sont là. L'impôt monte." },
    { label: "Pourquoi ils changent", phrase: "Retraite, patrimoine, prévoyance, financement : tout est dispersé." },
    { label: "Architecture", phrase: "PER, Lombard, SCPI, prévoyance." },
    { label: "Ticket 50 000 €", phrase: "Ticket moyen : 50 000 euros." },
    { label: "Commission 2 500 €", phrase: "5 %, soit 2 500 euros." },
    { label: "25 profils", phrase: "25 profils qualifiés en 3 mois." },
    { label: "13 signatures", phrase: "13 signatures. 50 % de conversion." },
    { label: "ROI 3 mois", phrase: "32 500 euros de commissions sur 3 mois." },
    { label: "Prix 3 900 €", phrase: "3 900 euros pour 3 mois." },
    { label: "Différence", phrase: "32 500 euros de commissions. 3 900 euros une fois." },
  ],

  S11_CaseBrokerage: [
    { label: "Cas conseil — cabinet", phrase: "Nos meilleures réussites. Premier cabinet : Oxygen Patrimoine." },
    { label: "Cas conseil — situation", phrase: "Un cabinet indépendant, IAS et CIF." },
    { label: "Cas conseil — action", phrase: "Un flux de profils qualifiés arrive dans l'agenda." },
    { label: "Cas conseil — résultat", phrase: "En 83 jours : 31 profils, 54 % de conversion." },
    { label: "Cas conseil — chiffres", phrase: "2 734 euros de panier moyen par profil." },
  ],

  S11_CaseAccounting: [
    { label: "Cas comptable — cabinet", phrase: "Deuxième cabinet : Cabinet Sanner." },
    { label: "Cas comptable — situation", phrase: "Un cabinet d'expertise comptable indépendant." },
    { label: "Cas comptable — action", phrase: "Des rendez-vous qualifiés, chaque mois." },
    { label: "Cas comptable — résultat", phrase: "10 032 euros de chiffre d'affaires cumulé sur 3 mois." },
    { label: "Cas comptable — chiffres", phrase: "11, puis 13, puis 13 profils. 53 % de conversion." },
  ],

  S12_SocialProof: [
    { label: "Saisons précédentes", phrase: "Et d'autres cabinets, déjà." },
  ],

  S15_FAQ: [
    { label: "FAQ — intro", phrase: "Des questions ?" },
    { label: "Q : région ?", phrase: "Les prospects sont-ils dans ma région ?" },
    { label: "R : région", phrase: "On priorise votre région si pertinent. Par défaut, France entière en visio. Le volume compense la conversion." },
    { label: "Q : paiement mensuel ?", phrase: "Puis-je payer au mois ?" },
    { label: "R : paiement", phrase: "Oui. 1 800 euros par mois, ou 3 900 euros pour 3 mois." },
    { label: "4 jours", phrase: "Quatre jours de rétractation." },
    { label: "Q : questions ?", phrase: "Est-ce que je peux changer les questions posées ?" },
    { label: "R : questions", phrase: "Oui, vous pouvez changer les questions. Objectif : une qualification selon vos critères." },
    { label: "Q : qualification ?", phrase: "Comment savoir si le profil est bien qualifié ?" },
    { label: "R : qualification", phrase: "Un profil qualifié cumule trois validations : problème concret validé niche par niche, budget avec plancher atteint, et rendez-vous — le prospect réserve lui-même dans votre agenda. Pas un nom sur une liste." },
    { label: "Q : IAS + CIF ?", phrase: "Pourquoi IAS et CIF sont dans la même offre ?" },
    { label: "R : IAS / CIF", phrase: "Le filtre est le même : 50 000 euros de trésorerie. L'usage change. IAS, ORIAS : le dirigeant est le point de défaillance, rien n'est couvert. CIF, AMF : le cash dort, l'impôt monte, aucun placement structuré. Une infrastructure, parce que le tri est identique. La prescription ne se mélange pas." },
  ],

  S16_Urgency: [
    { label: "Lien Stripe", phrase: "Le lien Stripe sera dans le chat." },
    { label: "4 places", phrase: "Quatre places par accompagnement." },
    { label: "5 minutes", phrase: "Cinq minutes pour s'inscrire." },
  ],

  S17_Close: [
    { label: "Cube final", phrase: "(silence)" },
  ],

  S18_StaticOffers: [
    { label: "Formules", phrase: "Les deux formules restent à l'écran." },
    { label: "Inscription", phrase: "L'inscription est ouverte, ou fermée." },
  ],
};

export function cueFor(scene: SceneId, step: number): Cue | undefined {
  return CUES[scene][step];
}
