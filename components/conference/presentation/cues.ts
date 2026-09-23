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
  11: { label: "Cube mélangé", phrase: "C'est un système incohérent.", next: "Point de départ" },

  // ── S03.5 Point de départ ───────────────────
  12: { label: "Point de départ", phrase: "(pause)", next: "Construire une audience" },

  // ── S03.6 Construire une audience ───────────
  13: { label: "Construire une audience", phrase: "Alors certains achètent des listes.", next: "Personne n'a demandé" },

  // ── S04 Leads froids ────────────────────────
  14: { label: "Personne n'a demandé", phrase: "Ces gens n'ont rien demandé.", next: "Appel / relances" },
  15: { label: "Relances", phrase: "Appel, relance, relance…", next: "Mauvais profil" },
  16: { label: "Profil ✕ ✕ ✕", phrase: "Et le profil ne correspond pas.", next: "Google Ads" },

  // ── S05 Google Ads ──────────────────────────
  17: { label: "Google Ads", phrase: "Alors… et si c'était eux qui venaient à vous ?", next: "Téléphone sonne" },
  18: { label: "Téléphone sonne", phrase: "Avec Google Ads, le téléphone sonne.", next: "Qui entre ?" },
  19: { label: "Qui entre ?", phrase: "Mais qui appelle ?", next: "Entonnoir" },
  20: { label: "Entonnoir", phrase: "Et l'entonnoir est brutal.", next: "Recadrage" },

  // ── S06 Reframing ───────────────────────────
  21: { label: "Découragement", phrase: "(pause) Aucune de ces approches ne résout le vrai problème.", next: "Orbite des 3 mots" },
  22: { label: "Volume / Qualité / Intérêt", phrase: "Volume, qualité, intérêt.", next: "Silence" },
  23: { label: "Silence ?", phrase: "Lequel des trois manque selon vous ?", next: "Cube mélangé" },
  24: { label: "Cube mélangé", phrase: "(silence)", next: "Solution 1" },

  // ── S07 Trois solutions ─────────────────────
  25: { label: "Bouche-à-oreille — bilan", phrase: "Le bouche-à-oreille donne de l'intérêt. Mais pas de volume.", next: "Leads — bilan" },
  26: { label: "Leads — bilan", phrase: "Les leads donnent du volume et de la qualité. Mais pas d'intérêt.", next: "Ads — bilan" },
  27: { label: "Ads — bilan", phrase: "Google Ads donne du volume et de l'intérêt. Mais pas de qualité.", next: "Mécanisme" },

  // ── S08 Mécanisme ───────────────────────────
  28: { label: "Flux VOLUME→INTÉRÊT", phrase: "Un système qui produit du volume qualifié avec intérêt.", next: "Révélation R2" },

  // ── S09 Révélation R2 ───────────────────────
  29: { label: "Cube → Logo", phrase: "Ce système, on l'appelle…", next: "HERCULE R2" },
  30: { label: "HERCULE R2", phrase: "Hercule R2.", next: "Construire une audience" },
  31: { label: "Audience — Volume", phrase: "Première étape : le volume.", next: "La liste se constitue" },
  32: { label: "Liste de pros", phrase: "Nous identifions une large liste de professionnels.", next: "BNC / BIC / TNS" },
  33: { label: "Profils cibles", phrase: "BNC, BIC, TNS — ou tout autre profil.", next: "Pas encore de filtre" },
  34: { label: "Le terrain", phrase: "À ce stade, on construit le volume. Pas encore le filtre.", next: "Le filtre" },
  35: { label: "FILTRE — Qualification", phrase: "Deuxième étape : la qualification.", next: "On prend contact" },
  36: { label: "Contact", phrase: "Nous prenons contact avec les professionnels identifiés.", next: "Trois grilles" },
  37: { label: "Trois grilles", phrase: "On ne pose pas les mêmes questions à tout le monde.", next: "DEC — suivi" },
  38: { label: "DEC — suivi", phrase: "Comment se passe le suivi financier du restaurant ?", next: "Réponse marge" },
  39: { label: "DEC — marges", phrase: "Pas de pilotage des marges, on veut le mettre en place.", next: "Pilotage" },
  40: { label: "DEC — pilotage", phrase: "Un accompagnement au-delà de la comptabilité ?", next: "Pilote avec nous" },
  41: { label: "DEC — confirmation", phrase: "Quelqu’un qui pilote avec nous, pas un prestataire de plus.", next: "300 € / mois" },
  42: { label: "DEC — 300 €", phrase: "Un accompagnement à 300 € par mois minimum, est-ce acceptable ?", next: "ROI démontré" },
  43: { label: "DEC — ROI", phrase: "Si le ROI est démontré, c’est ce que nous recherchons.", next: "Proposition visio" },
  44: { label: "DEC — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Contre-proposition créneau" },
  45: { label: "DEC — créneau", phrase: "Le 7 à 10h, je ne peux pas. Lundi à 13h ?", next: "DEC qualifié" },
  46: { label: "DEC — qualifié", phrase: "Prospect qualifié : solvable + pilotage.", next: "IAS — assurance" },
  47: { label: "IAS — assurance", phrase: "Avez-vous des besoins en assurance pour l’entreprise ?", next: "RC Pro / locaux" },
  48: { label: "IAS — besoins", phrase: "RC pro et locaux. Il faut remettre les contrats à niveau.", next: "Trésorerie" },
  49: { label: "IAS — trésorerie", phrase: "Plus de 50 000 € de trésorerie ?", next: "80 000 €" },
  50: { label: "IAS — 80 k€", phrase: "Autour de 80 000 €, on peut avancer.", next: "Réévaluation" },
  51: { label: "IAS — contrats", phrase: "Les contrats ont-ils été réévalués récemment ?", next: "Pas repris" },
  52: { label: "IAS — activité", phrase: "Rien n’a été repris, ça ne correspond plus.", next: "Ouverture" },
  53: { label: "IAS — couverture", phrase: "Ouvert à faire le point sur les garanties ?", next: "Garanties à jour" },
  54: { label: "IAS — accord", phrase: "Des garanties à jour, pas un devis pour le principe.", next: "Proposition visio" },
  55: { label: "IAS — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Demande du lien" },
  56: { label: "IAS — lien", phrase: "D’accord pour le 7. Envoyez le lien de la visio.", next: "IAS qualifié" },
  57: { label: "IAS — qualifié", phrase: "Prospect qualifié : 50 k€ + besoin d’assurance.", next: "CIF — impôt" },
  58: { label: "CIF — impôt", phrase: "Avez-vous une idée du montant d’impôt que vous payez ?", next: "Impôt vu" },
  59: { label: "CIF — impôt vu", phrase: "On le voit chaque année, on ne sait pas quoi en faire.", next: "50 000 €" },
  60: { label: "CIF — 50 k€", phrase: "Un minimum de 50 000 € pour activer des leviers ?", next: "100 000 €" },
  61: { label: "CIF — 100 k€", phrase: "Environ 100 000 €. Une proposition sérieuse.", next: "Leviers" },
  62: { label: "CIF — leviers", phrase: "Étudier les leviers adaptés avant de décider ?", next: "Trancher" },
  63: { label: "CIF — confirmation", phrase: "Oui. Je veux être accompagné pour trancher.", next: "Proposition visio" },
  64: { label: "CIF — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Contre-proposition créneau" },
  65: { label: "CIF — créneau", phrase: "Le 7 à 10h, je suis pris. Lundi à 13h ?", next: "CIF qualifié" },
  66: { label: "CIF — qualifié", phrase: "Prospect qualifié : 50 k€ + leviers identifiés.", next: "Logo R2" },
  67: { label: "Logo R2", phrase: "Voilà le système dans son ensemble.", next: "Courtage" },
  68: { label: "Courtage de projet", phrase: "Courtage de projet BNC, BIC, TNS. Patience et expertise métier.", next: "Cas pratique" },

  // ── S10 Le temps ────────────────────────────
  69: { label: "30 jours", phrase: "Deux rendez-vous par semaine.", next: "Zoom 4 mois" },
  70: { label: "25–30 rendez-vous", phrase: "Sur 4 mois : 25 à 30 rendez-vous.", next: "Hercule DEC" },

  // ── S13 Hercule DEC ─────────────────────────
  71: { label: "Restaurant", phrase: "Première offre : Hercule DEC. Prenons un restaurant.", next: "Leur problème" },
  72: { label: "Leur problème", phrase: "Le chiffre d’affaires monte. La marge se contracte.", next: "Pourquoi ils changent" },
  73: { label: "Pourquoi ils changent", phrase: "Le cabinet actuel ne traite pas ça.", next: "Ce que vous apportez" },
  74: { label: "Ce que vous apportez", phrase: "Ratio matière, pilotage, coûts, rentabilité.", next: "Budget" },
  75: { label: "Budget 300 €", phrase: "300 euros par mois.", next: "10 rendez-vous" },
  76: { label: "10 rendez-vous", phrase: "10 rendez-vous qualifiés par mois.", next: "5 signatures" },
  77: { label: "5 signatures", phrase: "5 signatures. 50 % de conversion.", next: "1 500 € / mois" },
  78: { label: "1 500 € / mois", phrase: "1 500 euros de revenus récurrents par mois.", next: "CA cumulé" },
  79: { label: "4 500 € cumulés", phrase: "4 500 euros de CA cumulé au deuxième mois.", next: "9 000 €" },
  80: { label: "9 000 € / 3 mois", phrase: "9 000 euros de CA cumulé sur 3 mois.", next: "Mois 1" },
  81: { label: "Mois 1", phrase: "1 500 euros de CA cumulé.", next: "Trimestre cumulé" },
  82: { label: "CA cumulé", phrase: "9 000 euros cumulés sur 3 mois — les abonnés du mois précédent renouvellent.", next: "Prix" },
  83: { label: "Prix 1 499 €", phrase: "1 499 euros par mois.", next: "Hercule Courtage" },

  // ── S14 Hercule Courtage ────────────────────
  84: { label: "Médecin", phrase: "Deuxième offre : Hercule Courtage. Prenons un médecin.", next: "Leur problème" },
  85: { label: "Pression fiscale", phrase: "Les revenus sont là. L’impôt monte.", next: "Pourquoi ils changent" },
  86: { label: "Pourquoi ils changent", phrase: "Retraite, patrimoine, prévoyance, financement : tout est dispersé.", next: "Architecture" },
  87: { label: "Architecture", phrase: "PER, Lombard, SCPI, prévoyance.", next: "Ticket" },
  88: { label: "Ticket 50 000 €", phrase: "Ticket moyen : 50 000 euros.", next: "Commission" },
  89: { label: "Commission 2 500 €", phrase: "5 %, soit 2 500 euros.", next: "25 profils" },
  90: { label: "25 profils", phrase: "25 profils qualifiés en 3 mois.", next: "13 signatures" },
  91: { label: "13 signatures", phrase: "13 signatures. 50 % de conversion.", next: "ROI 3 mois" },
  92: { label: "ROI 3 mois", phrase: "32 500 euros de commissions sur 3 mois.", next: "Prix" },
  93: { label: "Prix 3 900 €", phrase: "3 900 euros pour 3 mois.", next: "Différence" },
  94: { label: "Différence", phrase: "32 500 euros de commissions. 3 900 euros une fois.", next: "FAQ" },

  // ── S15 FAQ ─────────────────────────────────
  95: { label: "FAQ — intro", phrase: "Des questions ?", next: "Q1 : région" },
  96: { label: "Q : région ?", phrase: "Les prospects sont-ils dans ma région ?", next: "R : région" },
  97: { label: "R : région", phrase: "On priorise votre région si pertinent. Par défaut, France entière en visio. Le volume compense la conversion.", next: "Q2 : paiement mensuel" },
  98: { label: "Q : paiement mensuel ?", phrase: "Puis-je payer au mois ?", next: "R : paiement" },
  99: { label: "R : paiement", phrase: "Oui. 1 800 euros par mois, ou 3 900 euros pour 3 mois.", next: "Q3 : visibilité client" },
  100: { label: "Q : visibilité ?", phrase: "Est-ce que le client voit mon entreprise ?", next: "R : visibilité" },
  101: { label: "R : visibilité", phrase: "Non. Pas avant la dernière étape. Durant tout le processus, c’est Hercule qu’il voit.", next: "Q4 : qualification" },
  102: { label: "Q : qualification ?", phrase: "Comment savoir si le profil est bien qualifié ?", next: "R : qualification" },
  103: { label: "R : qualification", phrase: "Un profil qualifié cumule trois validations : problème concret validé niche par niche, budget avec plancher atteint, et rendez-vous — le prospect réserve lui-même dans votre agenda. Pas un nom sur une liste.", next: "Q5 : IAS + CIF" },
  104: { label: "Q : IAS + CIF ?", phrase: "Pourquoi IAS et CIF sont dans la même offre ?", next: "R : IAS / CIF" },
  105: { label: "R : IAS / CIF", phrase: "Le filtre est le même : 50 000 euros de trésorerie. L’usage change. IAS, ORIAS : le dirigeant est le point de défaillance, rien n’est couvert. CIF, AMF : le cash dort, l’impôt monte, aucun placement structuré. Une infrastructure, parce que le tri est identique. La prescription ne se mélange pas.", next: "Lien Stripe" },

  // ── S16 Inscription ─────────────────────────
  106: { label: "Lien Stripe", phrase: "Le lien Stripe sera dans le chat.", next: "4 places" },
  107: { label: "4 places", phrase: "Quatre places par accompagnement.", next: "5 minutes" },
  108: { label: "5 minutes", phrase: "Cinq minutes pour s’inscrire.", next: "Cube final" },

  // ── S17 Conclusion ──────────────────────────
  109: { label: "Cube final", phrase: "(silence)", next: "Formules" },

  // ── S18 Offres statiques ────────────────────
  110: { label: "Formules", phrase: "Les deux formules restent à l’écran.", next: "Inscription" },
  111: { label: "Inscription", phrase: "L’inscription est ouverte, ou fermée.", next: "Fin" },
};
