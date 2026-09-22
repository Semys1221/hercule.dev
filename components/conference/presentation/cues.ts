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
  1:  { label: "Noir", phrase: "(silence d'ouverture)", next: "Personnages apparaissent" },
  2:  { label: "Terrain", phrase: "On parle de qui, exactement ?", next: "Particuliers vs Professionnels" },
  3:  { label: "Professionnels", phrase: "Il y a une catégorie qui m'intéresse", next: "Trois marchés" },
  4:  { label: "Trois marchés", phrase: "Comptabilité, courtage, assurance…", next: "Capacité à investir" },
  5:  { label: "Capacité à investir", phrase: "Ce qui les distingue, c'est ça.", next: "Evan / Hercule.dev" },
  6:  { label: "Evan", phrase: "Je m'appelle Evan, voilà Hercule.", next: "Promesse flux" },
  7:  { label: "Promesse", phrase: "Voici ce que je vais vous montrer.", next: "Bouche-à-oreille" },

  // ── S02 Bouche-à-oreille ────────────────────
  8:  { label: "Bouche-à-oreille — titre", phrase: "Commençons par le début : le bouche-à-oreille.", next: "Confiance" },
  9:  { label: "Confiance", phrase: "Ça fonctionne parce que la confiance se transfère.", next: "Réseau" },
  10:  { label: "Réseau", phrase: "Et ça crée un réseau organique.", next: "Clôture bouche-à-oreille" },
  11:  { label: "Clôture bouche-à-oreille", phrase: "C'est efficace. Mais il reste des limites.", next: "Rupture ?" },

  // ── S03 Problème du BAO ─────────────────────
  12:  { label: "Rupture", phrase: "(pause)", next: "Volume ?" },
  13:  { label: "Volume ?", phrase: "Combien de recommandations par mois ?", next: "Moment ?" },
  14:  { label: "Moment ?", phrase: "Et quand exactement ?", next: "Profil ?" },
  15:  { label: "Profil ?", phrase: "Et quel profil ?", next: "Particulier ou pro ?" },
  16:  { label: "Particulier/Pro ?", phrase: "Parfois le référé est un particulier.", next: "Calendrier impossible" },
  17:  { label: "Calendrier vide", phrase: "Vous ne contrôlez rien du tout.", next: "Système incontrôlable" },
  18:  { label: "Cube mélangé", phrase: "C'est un système incohérent.", next: "Leads froids" },

  // ── S04 Leads froids ────────────────────────
  19:  { label: "Fiche de leads", phrase: "Alors certains achètent des listes.", next: "Personne n'a demandé" },
  20:  { label: "Personne n'a demandé", phrase: "Ces gens n'ont rien demandé.", next: "Appel / relances" },
  21:  { label: "Relances", phrase: "Appel, relance, relance…", next: "Mauvais profil" },
  22:  { label: "Profil ✕ ✕ ✕", phrase: "Et le profil ne correspond pas.", next: "Coût d'une conversation" },
  23:  { label: "0 €", phrase: "Vous avez payé pour parler.", next: "Google Ads" },

  // ── S05 Google Ads ──────────────────────────
  24:  { label: "Inversion", phrase: "Alors… et si c'était eux qui venaient à vous ?", next: "Téléphone sonne" },
  25:  { label: "Téléphone sonne", phrase: "Avec Google Ads, le téléphone sonne.", next: "Qui entre ?" },
  26:  { label: "Qui entre ?", phrase: "Mais qui appelle ?", next: "Filtre saturé" },
  27:  { label: "Filtre saturé", phrase: "Vous êtes votre propre filtre.", next: "Entonnoir" },
  28:  { label: "Entonnoir", phrase: "Et l'entonnoir est brutal.", next: "BNC 50k€ ?" },
  29:  { label: "BNC 50k€ ?", phrase: "Est-ce que le prospect a 50k€ de BNC ?", next: "Recadrage" },

  // ── S06 Reframing ───────────────────────────
  30:  { label: "Découragement", phrase: "(pause) Aucune de ces approches ne résout le vrai problème.", next: "Orbite des 3 mots" },
  31:  { label: "Volume / Qualité / Intérêt", phrase: "Volume, qualité, intérêt.", next: "Silence" },
  32:  { label: "Silence ?", phrase: "Lequel des trois manque selon vous ?", next: "Cube mélangé" },
  33:  { label: "Cube mélangé", phrase: "(silence)", next: "Faces VOLUME/QUALITÉ/INTÉRÊT" },
  34:  { label: "Trois faces", phrase: "Les trois sont nécessaires. Simultanément.", next: "Solution 1" },

  // ── S07 Trois solutions ─────────────────────
  35:  { label: "Bouche-à-oreille — bilan", phrase: "Le bouche-à-oreille donne de l'intérêt. Mais pas de volume.", next: "Leads — bilan" },
  36:  { label: "Leads — bilan", phrase: "Les leads donnent du volume et de la qualité. Mais pas d'intérêt.", next: "Ads — bilan" },
  37:  { label: "Ads — bilan", phrase: "Google Ads donne du volume et de l'intérêt. Mais pas de qualité.", next: "Mécanisme" },

  // ── S08 Mécanisme ───────────────────────────
  38:  { label: "Cube se résout", phrase: "Alors qu'est-ce qui résout les trois ?", next: "Cube résolu + flux" },
  39:  { label: "Flux VOLUME→INTÉRÊT", phrase: "Un système qui produit du volume qualifié avec intérêt.", next: "Révélation R2" },

  // ── S09 Révélation R2 ───────────────────────
  40:  { label: "Cube → Logo", phrase: "Ce système, on l'appelle…", next: "HERCULE R2" },
  41:  { label: "HERCULE R2", phrase: "Hercule R2.", next: "Le terrain de jeu" },
  42:  { label: "TERRAIN — Volume", phrase: "Première étape : le volume.", next: "La liste se constitue" },
  43:  { label: "Liste de pros", phrase: "Nous identifions une large liste de professionnels.", next: "BNC / BIC / TNS" },
  44:  { label: "Profils cibles", phrase: "BNC, BIC, TNS — ou tout autre profil.", next: "Pas encore de filtre" },
  45:  { label: "Le terrain", phrase: "À ce stade, on construit le volume. Pas encore le filtre.", next: "Le filtre" },
  46:  { label: "FILTRE — Qualification", phrase: "Deuxième étape : la qualification.", next: "On prend contact" },
  47:  { label: "Contact", phrase: "Nous prenons contact avec les professionnels identifiés.", next: "Trois grilles" },
  48:  { label: "Trois grilles", phrase: "On ne pose pas les mêmes questions à tout le monde.", next: "DEC — suivi" },
  49:  { label: "DEC — suivi", phrase: "Comment se passe le suivi financier du restaurant ?", next: "Réponse marge" },
  50:  { label: "DEC — marges", phrase: "Manque de visibilité sur les marges.", next: "Pilotage" },
  51:  { label: "DEC — pilotage", phrase: "Un accompagnement au-delà de la comptabilité ?", next: "Oui exactement" },
  52:  { label: "DEC — confirmation", phrase: "Oui, exactement.", next: "Rentabilité" },
  53:  { label: "DEC — rentabilité", phrase: "L’établissement est-il suffisamment rentable ?", next: "Activité stable" },
  54:  { label: "DEC — moyens", phrase: "Activité stable, moyens en place.", next: "Proposition visio" },
  55:  { label: "DEC — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Contre-proposition créneau" },
  56:  { label: "DEC — créneau", phrase: "Est-ce que lundi à 13h est possible ?", next: "DEC qualifié" },
  57:  { label: "DEC — qualifié", phrase: "Prospect qualifié : solvable + pilotage.", next: "IAS — assurance" },
  58:  { label: "IAS — assurance", phrase: "Avez-vous des besoins en assurance pour l’entreprise ?", next: "RC Pro / locaux" },
  59:  { label: "IAS — besoins", phrase: "RC Pro et locaux à assurer.", next: "Trésorerie" },
  60:  { label: "IAS — trésorerie", phrase: "Plus de 50 000 € de trésorerie ?", next: "80 000 €" },
  61:  { label: "IAS — 80 k€", phrase: "Environ 80 000 €.", next: "Réévaluation" },
  62:  { label: "IAS — contrats", phrase: "Les contrats ont-ils été réévalués récemment ?", next: "Pas vraiment" },
  63:  { label: "IAS — activité", phrase: "L’activité a beaucoup évolué.", next: "Ouverture" },
  64:  { label: "IAS — couverture", phrase: "Ouvert à faire le point sur les garanties ?", next: "Oui tout à fait" },
  65:  { label: "IAS — accord", phrase: "Oui, tout à fait.", next: "Proposition visio" },
  66:  { label: "IAS — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Demande du lien" },
  67:  { label: "IAS — lien", phrase: "Oui, quel est le lien de la visio ?", next: "IAS qualifié" },
  68:  { label: "IAS — qualifié", phrase: "Prospect qualifié : 50 k€ + besoin d’assurance.", next: "CIF — placement" },
  69:  { label: "CIF — placement", phrase: "Une partie de trésorerie à placer ?", next: "100 000 €" },
  70:  { label: "CIF — 100 k€", phrase: "Environ 100 000 € disponibles.", next: "Projet identifié" },
  71:  { label: "CIF — projet", phrase: "Montant disponible et projet de placement ?", next: "Solutions adaptées" },
  72:  { label: "CIF — solutions", phrase: "Quelles solutions seraient adaptées ?", next: "Accompagnement" },
  73:  { label: "CIF — étude", phrase: "Accompagnement avant de décider ?", next: "Oui exactement" },
  74:  { label: "CIF — confirmation", phrase: "Oui, exactement.", next: "Proposition visio" },
  75:  { label: "CIF — visio", phrase: "Seriez-vous disponible le 7 décembre à 10h ?", next: "Contre-proposition créneau" },
  76:  { label: "CIF — créneau", phrase: "Est-ce que lundi à 13h est possible ?", next: "CIF qualifié" },
  77:  { label: "CIF — qualifié", phrase: "Prospect qualifié : 50 k€ + projet de placement.", next: "Logo R2" },
  78:  { label: "Logo R2", phrase: "Voilà le système dans son ensemble.", next: "Cas pratique" },

  // ── S10 Le temps ────────────────────────────
  79:  { label: "Quelques minutes", phrase: "Quelques minutes après la question, il prend rendez-vous.", next: "30 jours" },
  80:  { label: "30 jours", phrase: "Deux rendez-vous par semaine.", next: "Zoom 4 mois" },
  81:  { label: "25–30 rendez-vous", phrase: "Sur 4 mois : 25 à 30 rendez-vous.", next: "Deux infrastructures" },

  // ── S12 Infrastructures ─────────────────────
  82:  { label: "Deux infrastructures", phrase: "Deux infrastructures disponibles aujourd’hui.", next: "Deux marchés" },
  83:  { label: "Deux marchés", phrase: "Elles répondent à deux marchés différents.", next: "Même principe" },
  84:  { label: "Même principe", phrase: "Identifier, qualifier, amener jusqu’à l’agenda.", next: "Paramètres" },
  85:  { label: "Paramètres", phrase: "Calendrier connecté, Zoom Pro, intégration finalisée.", next: "Déjà en place" },
  86:  { label: "Déjà en place", phrase: "Logistique adaptée. Vous ouvrez Zoom, vous auditez, vous présentez.", next: "Hercule DEC" },

  // ── S13 Hercule DEC ─────────────────────────
  87:  { label: "Restaurant", phrase: "Première offre : Hercule DEC. Prenons un restaurant.", next: "Leur problème" },
  88:  { label: "Leur problème", phrase: "Le chiffre d’affaires monte. La marge se contracte.", next: "Pourquoi ils changent" },
  89:  { label: "Pourquoi ils changent", phrase: "Le cabinet actuel ne traite pas ça.", next: "Ce que vous apportez" },
  90:  { label: "Ce que vous apportez", phrase: "Ratio matière, pilotage, coûts, rentabilité.", next: "Budget" },
  91:  { label: "Budget 300 €", phrase: "300 euros par mois.", next: "10 rendez-vous" },
  92:  { label: "10 rendez-vous", phrase: "10 rendez-vous qualifiés par mois.", next: "5 signatures" },
  93:  { label: "5 signatures", phrase: "5 signatures. 50 % de conversion.", next: "1 500 € / mois" },
  94:  { label: "1 500 € / mois", phrase: "1 500 euros de revenus récurrents par mois.", next: "Trimestre" },
  95:  { label: "4 500 € / trimestre", phrase: "4 500 euros de MRR à la fin du trimestre.", next: "12 mois" },
  96:  { label: "18 000 € / mois", phrase: "Au 12e mois, 18 000 euros de MRR.", next: "Prix" },
  97:  { label: "Prix 1 499 €", phrase: "1 499 euros pour 1 mois.", next: "Différence" },
  98:  { label: "Différence", phrase: "1 499 euros une fois. 1 500 euros chaque mois ensuite.", next: "Hercule Courtage" },

  // ── S14 Hercule Courtage ────────────────────
  99:  { label: "Médecin", phrase: "Deuxième offre : Hercule Courtage. Prenons un médecin.", next: "Leur problème" },
  100:  { label: "Pression fiscale", phrase: "Les revenus sont là. L’impôt monte.", next: "Pourquoi ils changent" },
  101:  { label: "Pourquoi ils changent", phrase: "Retraite, patrimoine, prévoyance, financement : tout est dispersé.", next: "Architecture" },
  102:  { label: "Architecture", phrase: "PER, Lombard, SCPI, prévoyance.", next: "Ticket" },
  103:  { label: "Ticket 50 000 €", phrase: "Ticket moyen : 50 000 euros.", next: "Commission" },
  104:  { label: "Commission 2 500 €", phrase: "5 %, soit 2 500 euros.", next: "25 profils" },
  105:  { label: "25 profils", phrase: "25 profils qualifiés en 3 mois.", next: "13 signatures" },
  106:  { label: "13 signatures", phrase: "13 signatures. 50 % de conversion.", next: "ROI 3 mois" },
  107:  { label: "ROI 3 mois", phrase: "32 500 euros de commissions sur 3 mois.", next: "Prix" },
  108:  { label: "Prix 3 900 €", phrase: "3 900 euros pour 3 mois.", next: "Différence" },
  109:  { label: "Différence", phrase: "32 500 euros de commissions. 3 900 euros une fois.", next: "Rétractation" },
  110:  { label: "Rétractation 4j", phrase: "Et vous avez 4 jours de rétractation.", next: "FAQ" },

  // ── S15 FAQ ─────────────────────────────────
  111:  { label: "FAQ — intro", phrase: "Des questions ?", next: "Q1 : région" },
  112:  { label: "Q : région ?", phrase: "Les prospects sont-ils dans ma région ?", next: "R : région" },
  113:  { label: "R : région", phrase: "On priorise votre région si pertinent. Par défaut, France entière en visio. Le volume compense la conversion.", next: "Q2 : paiement mensuel" },
  114:  { label: "Q : paiement mensuel ?", phrase: "Puis-je payer au mois ?", next: "R : paiement" },
  115:  { label: "R : paiement", phrase: "Oui. 1 800 euros par mois, ou 3 900 euros pour 3 mois.", next: "Q3 : visibilité client" },
  116:  { label: "Q : visibilité ?", phrase: "Est-ce que le client voit mon entreprise ?", next: "R : visibilité" },
  117:  { label: "R : visibilité", phrase: "Non. Pas avant la dernière étape. Durant tout le processus, c’est Hercule qu’il voit.", next: "Q4 : qualification" },
  118:  { label: "Q : qualification ?", phrase: "Comment savoir si le profil est bien qualifié ?", next: "R : qualification" },
  119:  { label: "R : qualification", phrase: "Un profil qualifié cumule trois validations : problème concret validé niche par niche, budget avec plancher atteint, et rendez-vous — le prospect réserve lui-même dans votre agenda. Pas un nom sur une liste.", next: "Q5 : IAS + CIF" },
  120:  { label: "Q : IAS + CIF ?", phrase: "Pourquoi IAS et CIF sont dans la même offre ?", next: "R : IAS / CIF" },
  121:  { label: "R : IAS / CIF", phrase: "Le filtre est le même : 50 000 euros de trésorerie. L’usage change. IAS, ORIAS : le dirigeant est le point de défaillance, rien n’est couvert. CIF, AMF : le cash dort, l’impôt monte, aucun placement structuré. Une infrastructure, parce que le tri est identique. La prescription ne se mélange pas.", next: "Inscription" },

  // ── S16 Inscription ─────────────────────────
  122:  { label: "Lien de paiement", phrase: "Le lien de paiement est dans le chat.", next: "Conclusion" },

  // ── S17 Conclusion ──────────────────────────
  123:  { label: "Éléments disparaissent", phrase: "Passons aux modalités concrètes.", next: "Places limitées" },
  124:  { label: "Places limitées", phrase: "Les places sont limitées.", next: "Formulation finale" },
  125:  { label: "Formulation finale", phrase: "(silence) Les décisions qui façonne l'avenir sont prise aujourd'hui", next: "Logo final" },
  126:  { label: "Logo final", phrase: "(silence)", next: "Formules" },

  // ── S18 Offres statiques ────────────────────
  127:  { label: "Formules", phrase: "Les deux formules restent à l’écran.", next: "Inscription" },
  128:  { label: "Inscription", phrase: "L’inscription est ouverte, ou fermée.", next: "Fin" },
};
