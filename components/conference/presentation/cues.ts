/**
 * Cues de présentation — guidance pour chaque beat.
 *
 * Structure :
 *   label  : nom court du beat (affiché dans le HUD)
 *   phrase : courte phrase déclenchante (ce que le présentateur dit AVANT d'appuyer sur Space)
 *   next   : ce qui va apparaître APRÈS avoir appuyé (action visuelle)
 */

export type Cue = {
  label: string;
  phrase?: string;
  next?: string;
};

/** Mapping beat.id → Cue */
export const CUES: Record<number, Cue> = {

  // ── S01 Introduction ────────────────────────
  1:  { label: "Noir", phrase: "(silence d'ouverture)", next: "Trois marchés" },
  2:  { label: "Trois marchés", phrase: "Comptabilité, courtage, assurance…", next: "Evan / Hercule.dev" },
  3:  { label: "Evan", phrase: "Je m'appelle Evan, voilà Hercule.", next: "Bouche-à-oreille" },

  // ── S02 Bouche-à-oreille ────────────────────
  4:  { label: "Bouche-à-oreille — titre", phrase: "Commençons par le début : le bouche-à-oreille.", next: "Confiance" },
  5:  { label: "Confiance", phrase: "Ça fonctionne parce que la confiance se transfère.", next: "Réseau" },
  6:  { label: "Réseau", phrase: "Et ça crée un réseau organique.", next: "Rupture ?" },

  // ── S03 Problème du BAO ─────────────────────
  7:  { label: "Rupture", phrase: "(pause)", next: "Volume ?" },
  8:  { label: "Volume ?", phrase: "Combien de recommandations par mois ?", next: "Moment ?" },
  9:  { label: "Moment ?", phrase: "Et quand exactement ?", next: "Profil ?" },
  10: { label: "Profil ?", phrase: "Et quel profil ?", next: "Système incontrôlable" },
  11: { label: "Cube mélangé", phrase: "C'est un système incohérent.", next: "Fiche de lead" },

  // ── S04 Leads froids ────────────────────────
  12: { label: "Fiche de lead", phrase: "Alors certains achètent des listes.", next: "Personne n'a demandé" },
  13: { label: "Personne n'a demandé", phrase: "Ces gens n'ont rien demandé.", next: "Appel / relances" },
  14: { label: "Relances", phrase: "Appel, relance, relance…", next: "Mauvais profil" },
  15: { label: "Profil ✕ ✕ ✕", phrase: "Et le profil ne correspond pas.", next: "Google Ads" },

  // ── S05 Google Ads ──────────────────────────
  16: { label: "Google Ads", phrase: "Alors… et si c'était eux qui venaient à vous ?", next: "Téléphone sonne" },
  17: { label: "Téléphone sonne", phrase: "Avec Google Ads, le téléphone sonne.", next: "Qui entre ?" },
  18: { label: "Qui entre ?", phrase: "Mais qui appelle ?", next: "Entonnoir" },
  19: { label: "Entonnoir", phrase: "Et l'entonnoir est brutal.", next: "Recadrage" },

  // ── S06 Reframing ───────────────────────────
  20: { label: "Découragement", phrase: "(pause) Aucune de ces approches ne résout le vrai problème.", next: "Orbite des 3 mots" },
  21: { label: "Volume / Qualité / Intérêt", phrase: "Volume, qualité, intérêt.", next: "Silence" },
  22: { label: "Silence ?", phrase: "Lequel des trois manque selon vous ?", next: "Cube mélangé" },
  23: { label: "Cube mélangé", phrase: "(silence)", next: "Solution 1" },

  // ── S07 Trois solutions ─────────────────────
  24: { label: "Bouche-à-oreille — bilan", phrase: "Le bouche-à-oreille donne de l'intérêt. Mais pas de volume.", next: "Leads — bilan" },
  25: { label: "Leads — bilan", phrase: "Les leads donnent du volume et de la qualité. Mais pas d'intérêt.", next: "Ads — bilan" },
  26: { label: "Ads — bilan", phrase: "Google Ads donne du volume et de l'intérêt. Mais pas de qualité.", next: "Mécanisme" },

  // ── S08 Mécanisme ───────────────────────────
  27: { label: "Flux VOLUME→INTÉRÊT", phrase: "Un système qui produit du volume qualifié avec intérêt.", next: "Révélation R2" },

  // ── S09 Révélation R2 ───────────────────────
  28: { label: "Cube → Logo", phrase: "Ce système, on l'appelle…", next: "HERCULE R2" },
  29: { label: "HERCULE R2", phrase: "Hercule R2.", next: "Le terrain de jeu" },
  30: { label: "TERRAIN — Volume", phrase: "Première étape : le volume.", next: "La liste se constitue" },
  31: { label: "Liste de pros", phrase: "Nous identifions une large liste de professionnels.", next: "BNC / BIC / TNS" },
  32: { label: "Profils cibles", phrase: "BNC, BIC, TNS — ou tout autre profil.", next: "Pas encore de filtre" },
  33: { label: "Le terrain", phrase: "À ce stade, on construit le volume. Pas encore le filtre.", next: "Le filtre" },
  34: { label: "FILTRE — Qualification", phrase: "Deuxième étape : la qualification.", next: "On prend contact" },
  35: { label: "Contact", phrase: "Nous prenons contact avec les professionnels identifiés.", next: "Trois grilles" },
  36: { label: "Trois grilles", phrase: "On ne pose pas les mêmes questions à tout le monde.", next: "DEC — suivi" },
  37: { label: "DEC — suivi", phrase: "Comment se passe le suivi financier du restaurant ?", next: "Réponse marge" },
  38: { label: "DEC — marges", phrase: "Pas de pilotage des marges, on veut le mettre en place.", next: "Pilotage" },
  39: { label: "DEC — pilotage", phrase: "Un accompagnement au-delà de la comptabilité ?", next: "Pilote avec nous" },
  40: { label: "DEC — confirmation", phrase: "Quelqu’un qui pilote avec nous, pas un prestataire de plus.", next: "300 € / mois" },
  41: { label: "DEC — 300 €", phrase: "Un accompagnement à 300 € par mois minimum, est-ce acceptable ?", next: "ROI démontré" },
  42: { label: "DEC — ROI", phrase: "Si le ROI est démontré, c’est ce que nous recherchons.", next: "Proposition visio" },
  43: { label: "DEC — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Contre-proposition créneau" },
  44: { label: "DEC — créneau", phrase: "Le 7 à 10h, je ne peux pas. Lundi à 13h ?", next: "DEC qualifié" },
  45: { label: "DEC — qualifié", phrase: "Prospect qualifié : solvable + pilotage.", next: "IAS — assurance" },
  46: { label: "IAS — assurance", phrase: "Avez-vous des besoins en assurance pour l’entreprise ?", next: "RC Pro / locaux" },
  47: { label: "IAS — besoins", phrase: "RC pro et locaux. Il faut remettre les contrats à niveau.", next: "Trésorerie" },
  48: { label: "IAS — trésorerie", phrase: "Plus de 50 000 € de trésorerie ?", next: "80 000 €" },
  49: { label: "IAS — 80 k€", phrase: "Autour de 80 000 €, on peut avancer.", next: "Réévaluation" },
  50: { label: "IAS — contrats", phrase: "Les contrats ont-ils été réévalués récemment ?", next: "Pas repris" },
  51: { label: "IAS — activité", phrase: "Rien n’a été repris, ça ne correspond plus.", next: "Ouverture" },
  52: { label: "IAS — couverture", phrase: "Ouvert à faire le point sur les garanties ?", next: "Garanties à jour" },
  53: { label: "IAS — accord", phrase: "Des garanties à jour, pas un devis pour le principe.", next: "Proposition visio" },
  54: { label: "IAS — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Demande du lien" },
  55: { label: "IAS — lien", phrase: "D’accord pour le 7. Envoyez le lien de la visio.", next: "IAS qualifié" },
  56: { label: "IAS — qualifié", phrase: "Prospect qualifié : 50 k€ + besoin d’assurance.", next: "CIF — placement" },
  57: { label: "CIF — placement", phrase: "Une partie de trésorerie à placer ?", next: "100 000 €" },
  58: { label: "CIF — 100 k€", phrase: "Environ 100 000 € à placer. Une proposition sérieuse.", next: "Projet identifié" },
  59: { label: "CIF — projet", phrase: "Montant disponible et projet de placement ?", next: "Solutions adaptées" },
  60: { label: "CIF — solutions", phrase: "La solution adaptée, et qu’on la mette en place.", next: "Accompagnement" },
  61: { label: "CIF — étude", phrase: "Accompagnement avant de décider ?", next: "Trancher" },
  62: { label: "CIF — confirmation", phrase: "Oui. Je veux être accompagné pour trancher.", next: "Proposition visio" },
  63: { label: "CIF — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Contre-proposition créneau" },
  64: { label: "CIF — créneau", phrase: "Le 7 à 10h, je suis pris. Lundi à 13h ?", next: "CIF qualifié" },
  65: { label: "CIF — qualifié", phrase: "Prospect qualifié : 50 k€ + projet de placement.", next: "Logo R2" },
  66: { label: "Logo R2", phrase: "Voilà le système dans son ensemble.", next: "Cas pratique" },

  // ── S10 Le temps ────────────────────────────
  67: { label: "30 jours", phrase: "Deux rendez-vous par semaine.", next: "Zoom 4 mois" },
  68: { label: "25–30 rendez-vous", phrase: "Sur 4 mois : 25 à 30 rendez-vous.", next: "Hercule DEC" },

  // ── S13 Hercule DEC ─────────────────────────
  69: { label: "Restaurant", phrase: "Première offre : Hercule DEC. Prenons un restaurant.", next: "Leur problème" },
  70: { label: "Leur problème", phrase: "Le chiffre d’affaires monte. La marge se contracte.", next: "Pourquoi ils changent" },
  71: { label: "Pourquoi ils changent", phrase: "Le cabinet actuel ne traite pas ça.", next: "Ce que vous apportez" },
  72: { label: "Ce que vous apportez", phrase: "Ratio matière, pilotage, coûts, rentabilité.", next: "Budget" },
  73: { label: "Budget 300 €", phrase: "300 euros par mois.", next: "10 rendez-vous" },
  74: { label: "10 rendez-vous", phrase: "10 rendez-vous qualifiés par mois.", next: "5 signatures" },
  75: { label: "5 signatures", phrase: "5 signatures. 50 % de conversion.", next: "1 500 € / mois" },
  76: { label: "1 500 € / mois", phrase: "1 500 euros de revenus récurrents par mois.", next: "Trimestre" },
  77: { label: "4 500 € / trimestre", phrase: "4 500 euros de MRR à la fin du trimestre.", next: "12 mois" },
  78: { label: "18 000 € / mois", phrase: "Au 12e mois, 18 000 euros de MRR.", next: "Prix" },
  79: { label: "Prix 1 499 €", phrase: "1 499 euros pour 1 mois.", next: "Différence" },
  80: { label: "Différence", phrase: "1 500, 3 000, 4 500 euros sur 3 mois. 1 499 euros par mois.", next: "Hercule Courtage" },

  // ── S14 Hercule Courtage ────────────────────
  81: { label: "Médecin", phrase: "Deuxième offre : Hercule Courtage. Prenons un médecin.", next: "Leur problème" },
  82: { label: "Pression fiscale", phrase: "Les revenus sont là. L’impôt monte.", next: "Pourquoi ils changent" },
  83: { label: "Pourquoi ils changent", phrase: "Retraite, patrimoine, prévoyance, financement : tout est dispersé.", next: "Architecture" },
  84: { label: "Architecture", phrase: "PER, Lombard, SCPI, prévoyance.", next: "Ticket" },
  85: { label: "Ticket 50 000 €", phrase: "Ticket moyen : 50 000 euros.", next: "Commission" },
  86: { label: "Commission 2 500 €", phrase: "5 %, soit 2 500 euros.", next: "25 profils" },
  87: { label: "25 profils", phrase: "25 profils qualifiés en 3 mois.", next: "13 signatures" },
  88: { label: "13 signatures", phrase: "13 signatures. 50 % de conversion.", next: "ROI 3 mois" },
  89: { label: "ROI 3 mois", phrase: "32 500 euros de commissions sur 3 mois.", next: "Prix" },
  90: { label: "Prix 3 900 €", phrase: "3 900 euros pour 3 mois.", next: "Différence" },
  91: { label: "Différence", phrase: "32 500 euros de commissions. 3 900 euros une fois.", next: "FAQ" },

  // ── S15 FAQ ─────────────────────────────────
  92: { label: "FAQ — intro", phrase: "Des questions ?", next: "Q1 : région" },
  93: { label: "Q : région ?", phrase: "Les prospects sont-ils dans ma région ?", next: "R : région" },
  94: { label: "R : région", phrase: "On priorise votre région si pertinent. Par défaut, France entière en visio. Le volume compense la conversion.", next: "Q2 : paiement mensuel" },
  95: { label: "Q : paiement mensuel ?", phrase: "Puis-je payer au mois ?", next: "R : paiement" },
  96: { label: "R : paiement", phrase: "Oui. 1 800 euros par mois, ou 3 900 euros pour 3 mois.", next: "Q3 : visibilité client" },
  97: { label: "Q : visibilité ?", phrase: "Est-ce que le client voit mon entreprise ?", next: "R : visibilité" },
  98: { label: "R : visibilité", phrase: "Non. Pas avant la dernière étape. Durant tout le processus, c’est Hercule qu’il voit.", next: "Q4 : qualification" },
  99: { label: "Q : qualification ?", phrase: "Comment savoir si le profil est bien qualifié ?", next: "R : qualification" },
  100: { label: "R : qualification", phrase: "Un profil qualifié cumule trois validations : problème concret validé niche par niche, budget avec plancher atteint, et rendez-vous — le prospect réserve lui-même dans votre agenda. Pas un nom sur une liste.", next: "Q5 : IAS + CIF" },
  101: { label: "Q : IAS + CIF ?", phrase: "Pourquoi IAS et CIF sont dans la même offre ?", next: "R : IAS / CIF" },
  102: { label: "R : IAS / CIF", phrase: "Le filtre est le même : 50 000 euros de trésorerie. L’usage change. IAS, ORIAS : le dirigeant est le point de défaillance, rien n’est couvert. CIF, AMF : le cash dort, l’impôt monte, aucun placement structuré. Une infrastructure, parce que le tri est identique. La prescription ne se mélange pas.", next: "Places limitées" },

  // ── S17 Conclusion ──────────────────────────
  103: { label: "Places limitées", phrase: "Les places sont limitées.", next: "Logo final" },
  104: { label: "Logo final", phrase: "(silence)", next: "Formules" },

  // ── S18 Offres statiques ────────────────────
  105: { label: "Formules", phrase: "Les deux formules restent à l’écran.", next: "Inscription" },
  106: { label: "Inscription", phrase: "L’inscription est ouverte, ou fermée.", next: "Fin" },
};
