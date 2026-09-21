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
  // ── S01 Introduction ─────────────────────────────────────────
  1:  { label: "Noir",                phrase: "(silence d'ouverture)",               next: "Personnages apparaissent" },
  2:  { label: "Terrain",             phrase: "On parle de qui, exactement ?",        next: "Particuliers vs Professionnels" },
  3:  { label: "Professionnels",      phrase: "Il y a une catégorie qui m'intéresse", next: "Trois marchés" },
  4:  { label: "Trois marchés",       phrase: "Comptabilité, courtage, assurance…",   next: "Capacité à investir" },
  5:  { label: "Capacité à investir", phrase: "Ce qui les distingue, c'est ça.",      next: "Evan / Hercule.dev" },
  6:  { label: "Evan",                phrase: "Je m'appelle Evan, voilà Hercule.",    next: "Promesse flux" },
  7:  { label: "Promesse",            phrase: "Voici ce que je vais vous montrer.",   next: "Chapitre BAO" },

  // ── S02 Bouche-à-oreille ──────────────────────────────────────
  8:  { label: "BAO — titre",         phrase: "Commençons par le début : le bouche-à-oreille.", next: "Confiance" },
  9:  { label: "Confiance",           phrase: "Ça fonctionne parce que la confiance se transfère.", next: "Réseau" },
  10: { label: "Réseau",              phrase: "Et ça crée un réseau organique.",      next: "Clôture BAO" },
  11: { label: "Clôture BAO",         phrase: "C'est beau. Mais il y a un problème.", next: "Rupture ?" },

  // ── S03 Problème du BAO ───────────────────────────────────────
  12: { label: "Rupture",             phrase: "(pause)",                              next: "Volume ?" },
  13: { label: "Volume ?",            phrase: "Combien de recommandations par mois ?", next: "Moment ?" },
  14: { label: "Moment ?",            phrase: "Et quand exactement ?",               next: "Profil ?" },
  15: { label: "Profil ?",            phrase: "Et quel profil ?",                    next: "Particulier ou pro ?" },
  16: { label: "Particulier/Pro ?",   phrase: "Parfois le référé est un particulier.", next: "Calendrier impossible" },
  17: { label: "Calendrier vide",     phrase: "Vous ne contrôlez rien du tout.",      next: "Système incontrôlable" },
  18: { label: "Cube mélangé",        phrase: "C'est un système incohérent.",         next: "Leads froids" },

  // ── S04 Leads froids ─────────────────────────────────────────
  19: { label: "Grande liste",        phrase: "Alors certains achètent des listes.",  next: "Personne n'a demandé" },
  20: { label: "Personne n'a demandé", phrase: "Ces gens n'ont rien demandé.",        next: "Appel / relances" },
  21: { label: "Relances",            phrase: "Appel, relance, relance…",             next: "Mauvais profil" },
  22: { label: "Profil ✕ ✕ ✕",       phrase: "Et le profil ne correspond pas.",      next: "Coût d'une conversation" },
  23: { label: "0 €",                 phrase: "Vous avez payé pour parler.",          next: "Google Ads" },

  // ── S05 Google Ads ───────────────────────────────────────────
  24: { label: "Inversion",           phrase: "Alors… et si c'était eux qui venaient à vous ?", next: "Téléphone sonne" },
  25: { label: "Téléphone sonne",     phrase: "Avec Google Ads, le téléphone sonne.", next: "Qui entre ?" },
  26: { label: "Qui entre ?",         phrase: "Mais qui appelle ?",                   next: "Filtre saturé" },
  27: { label: "Filtre saturé",       phrase: "Vous êtes votre propre filtre.",       next: "Entonnoir" },
  28: { label: "Entonnoir",           phrase: "Et l'entonnoir est brutal.",           next: "BNC 50k€ ?" },
  29: { label: "BNC 50k€ ?",          phrase: "Est-ce que le prospect a 50k€ de BNC ?", next: "Reframing" },

  // ── S06 Reframing ────────────────────────────────────────────
  30: { label: "Découragement",       phrase: "(pause) Aucune de ces approches ne résout le vrai problème.", next: "Orbite des 3 mots" },
  31: { label: "Volume / Qualité / Intérêt", phrase: "Volume, qualité, intérêt.", next: "Silence" },
  32: { label: "Silence ?",           phrase: "Lequel des trois manque selon vous ?", next: "Cube mélangé" },
  33: { label: "Cube mélangé",        phrase: "(silence)",                            next: "Faces VOLUME/QUALITÉ/INTÉRÊT" },
  34: { label: "Trois faces",         phrase: "Les trois sont nécessaires. Simultanément.", next: "Solution 1" },

  // ── S07 Trois solutions ──────────────────────────────────────
  35: { label: "BAO — bilan",         phrase: "Le bouche-à-oreille donne de l'intérêt. Mais pas de volume.", next: "Leads — bilan" },
  36: { label: "Leads — bilan",       phrase: "Les leads donnent du volume et de la qualité. Mais pas d'intérêt.", next: "Ads — bilan" },
  37: { label: "Ads — bilan",         phrase: "Google Ads donne du volume et de l'intérêt. Mais pas de qualité.", next: "Mécanisme" },

  // ── S08 Mécanisme ────────────────────────────────────────────
  38: { label: "Cube se résout",      phrase: "Alors qu'est-ce qui résout les trois ?", next: "Cube résolu + flux" },
  39: { label: "Flux VOLUME→RDV",     phrase: "Un système qui produit du volume qualifié avec intérêt.", next: "Révélation R2" },

  // ── S09 Révélation R2 ────────────────────────────────────────
  40: { label: "Cube → Logo",         phrase: "Ce système, on l'appelle…",            next: "HERCULE R2" },
  41: { label: "HERCULE R2",          phrase: "Hercule R2.",                          next: "Étape : VOLUME" },
  42: { label: "VOLUME",              phrase: "Première étape : le volume.",          next: "Étape : QUALIFICATION" },
  43: { label: "QUALIFICATION",       phrase: "Deuxième étape : la qualification.",   next: "Étape : INTÉRÊT" },
  44: { label: "INTÉRÊT",             phrase: "Troisième étape : l'intérêt.",         next: "Rendez-vous ✓" },
  45: { label: "Rendez-vous ✓",       phrase: "Ce qui donne un rendez-vous qualifié.", next: "Révélation complète" },
  46: { label: "Révélation complète", phrase: "Voilà le système dans son ensemble.",  next: "Démo John" },

  // ── S10 Démo John ────────────────────────────────────────────
  47: { label: "John",                phrase: "Pour le concret, prenons John.",        next: "Objectif de John" },
  48: { label: "Objectif",            phrase: "John veut des professionnels qualifiés.", next: "Carte France" },
  49: { label: "France régionale",    phrase: "Il est en Île-de-France.",              next: "Extension nationale" },
  50: { label: "Extension nationale", phrase: "Avec Hercule, toute la France.",        next: "Calendrier vide" },
  51: { label: "Calendrier vide",     phrase: "Au départ, son agenda est vide.",       next: "C'est normal" },
  52: { label: "C'est normal",        phrase: "C'est normal. Le volume doit venir en premier.", next: "Flux → téléphone" },
  53: { label: "Flux → téléphone",    phrase: "On génère du volume ciblé.",            next: "Critères qualification" },
  54: { label: "Critères",            phrase: "Pour chaque profil : activité, budget, projet.", next: "Sélection" },
  55: { label: "Sélection",           phrase: "On filtre. On garde les bons.",         next: "Qualification conservée" },
  56: { label: "Qualification ✓",     phrase: "Ces profils sont maintenant qualifiés.", next: "Problème présenté" },
  57: { label: "Problème présenté",   phrase: "On leur présente leur problème précis.", next: "Compréhension" },
  58: { label: "Compréhension ✓",     phrase: "Ils reconnaissent le problème.",        next: "Inversion JOHN ← PROS" },
  59: { label: "INVERSION ←",         phrase: "Et là… quelque chose change.",          next: "Prise de RDV" },
  60: { label: "Prise de RDV",        phrase: "C'est le prospect qui demande un rendez-vous.", next: "Plus besoin de courir" },
  61: { label: "Plus besoin de courir", phrase: "John n'a plus à courir.",             next: "Prospect arrive" },
  62: { label: "Prospect arrive",     phrase: "C'est le prospect qui se déplace vers John.", next: "2 RDV / semaine" },
  63: { label: "2 RDV / semaine",     phrase: "Résultat : deux rendez-vous par semaine.", next: "Pas juste 2 RDV" },
  64: { label: "Pas juste 2 RDV",     phrase: "Mais pas n'importe lesquels.",          next: "Profils ✓✓✓" },
  65: { label: "Profils ✓✓✓",         phrase: "Des professionnels qui ont demandé à vous parler.", next: "Timeline 90j" },
  66: { label: "Timeline 90j",        phrase: "Sur 90 jours.",                         next: "30 profils qualifiés" },
  67: { label: "30 profils qualifiés", phrase: "30 profils qualifiés passent dans son agenda.", next: "Exemples métiers" },
  68: { label: "Exemples",            phrase: "Restaurants, BTP, chirurgiens…",        next: "Conversion 50 %" },
  69: { label: "Conversion 50 %",     phrase: "Avec un taux de conversion de 50 %.",   next: "Finalité" },
  70: { label: "Finalité",            phrase: "C'est ça l'objectif du système.",       next: "Pas du trafic" },
  71: { label: "Pas du trafic",       phrase: "Ce n'est pas du trafic. Ce n'est pas des leads.", next: "Flux continu" },
  72: { label: "Flux continu",        phrase: "C'est un flux continu de professionnels dans votre agenda.", next: "Installation" },

  // ── S11 Installation ─────────────────────────────────────────
  73: { label: "Question : comment ?", phrase: "Comment se mettre devant des millions de pros ?", next: "Réponse : vous ne le faites pas" },
  74: { label: "Vous ne le faites pas", phrase: "(pause) Vous ne le faites pas.",     next: "Hercule + cube" },
  75: { label: "Hercule s'en charge",  phrase: "Hercule s'en charge pour vous.",       next: "Connexion calendrier" },
  76: { label: "Calendrier connecté", phrase: "On connecte votre calendrier.",         next: "Zoom Pro" },
  77: { label: "Zoom Pro",            phrase: "Vous avez besoin d'un Zoom Pro.",        next: "Appel intégration" },
  78: { label: "Appel intégration",   phrase: "Un appel d'intégration pour tout configurer.", next: "Adaptabilité" },
  79: { label: "Adaptabilité",        phrase: "Le système s'adapte à votre secteur.",  next: "Tourne en arrière-plan" },
  80: { label: "En arrière-plan",     phrase: "Ensuite il tourne en arrière-plan.",    next: "Agenda se remplit" },
  81: { label: "Agenda se remplit",   phrase: "Et votre agenda se remplit.",           next: "Votre rôle" },
  82: { label: "Votre rôle",          phrase: "Votre seul rôle : zoom, audit, offre.", next: "Transition offres" },

  // ── S12 Transition offres ────────────────────────────────────
  83: { label: "DEC / COURTAGE",      phrase: "Ce système existe en deux versions.",   next: "Même process" },
  84: { label: "Même process",        phrase: "Même mécanique, deux marchés.",         next: "Hercule DEC" },

  // ── S13 Hercule DEC ──────────────────────────────────────────
  85: { label: "Restaurant",          phrase: "Première offre : Hercule DEC. Prenons un restaurateur.", next: "Problème CA/Marge" },
  86: { label: "CA / Marge / Renta",  phrase: "Problème classique : CA monte, marges se contractent.", next: "CA ↑ Marge ↓" },
  87: { label: "CA ↑ Marge ↓",        phrase: "Il gagne plus. Il garde moins.",        next: "Votre cabinet" },
  88: { label: "Votre cabinet",       phrase: "C'est là que vous intervenez.",         next: "Services" },
  89: { label: "Services DEC",        phrase: "Ratio matière, pilotage, coûts, rentabilité.", next: "300 €/mois" },
  90: { label: "300 €/mois",          phrase: "Tarification : 300 euros par mois.",    next: "10 restaurants" },
  91: { label: "10 restaurants",      phrase: "Hercule vous apporte 10 restaurants qualifiés.", next: "3 signatures" },
  92: { label: "3 signatures",        phrase: "Objectif : 3 signatures.",              next: "900 € MRR" },
  93: { label: "900 € MRR",           phrase: "Soit 900 euros de revenus récurrents mensuels.", next: "12 mois" },
  94: { label: "12 mois / 36 clients", phrase: "Sur 12 mois : 36 clients.",            next: "10 800 € MRR" },
  95: { label: "129 600 € annuel",    phrase: "Ce qui représente 129 600 euros annuels récurrents.", next: "Prix 1 499 €" },
  96: { label: "Prix 1 499 €/mois",   phrase: "Prix Hercule DEC : 1 499 euros par mois.", next: "Hercule Courtage" },

  // ── S14 Hercule Courtage ─────────────────────────────────────
  97:  { label: "Médecin",            phrase: "Deuxième offre : Hercule Courtage. Prenons un médecin.", next: "Profil collectif" },
  98:  { label: "Profil collectif",   phrase: "Ces profils ont un point commun.",       next: "Pression fiscale" },
  99:  { label: "Pression fiscale",   phrase: "Ils subissent une forte pression fiscale.", next: "Cartes dispersées" },
  100: { label: "Cartes dispersées",  phrase: "Retraite, patrimoine, prévoyance, financement…", next: "Architecture" },
  101: { label: "Architecture",       phrase: "On construit une architecture sur mesure.", next: "Solutions" },
  102: { label: "Solutions",          phrase: "PER, Lombard, SCPI, IFC…",              next: "50 000 € ticket" },
  103: { label: "50 000 €",           phrase: "Ticket moyen : 50 000 euros.",           next: "2 500 € commission" },
  104: { label: "2 500 € commission", phrase: "Commission : 5 % soit 2 500 euros.",    next: "25 profils / 3 mois" },
  105: { label: "25 profils",         phrase: "Hercule vous apporte 25 médecins qualifiés en 3 mois.", next: "9 signatures" },
  106: { label: "9 signatures",       phrase: "Objectif : 9 signatures.",              next: "450 000 € encours" },
  107: { label: "450 000 € encours",  phrase: "Soit 450 000 euros d'encours.",          next: "Prix 3 900 € / 3 mois" },
  108: { label: "Prix 3 900 € / 3 mois", phrase: "Prix Hercule Courtage : 3 900 euros pour 3 mois.", next: "Rétractation" },
  109: { label: "Rétractation 4j",    phrase: "Et vous avez 4 jours de rétractation.",  next: "FAQ" },

  // ── S15 FAQ ──────────────────────────────────────────────────
  110: { label: "FAQ — intro",        phrase: "Des questions ?",                        next: "Q1 : région" },
  111: { label: "Q : région ?",       phrase: "(répondre : oui, ciblage régional possible)", next: "Q2 : paiement mensuel" },
  112: { label: "Q : paiement mensuel ?", phrase: "(répondre)",                         next: "Q3 : visibilité client" },
  113: { label: "Q : visibilité ?",   phrase: "(répondre : non, vous restez invisible)", next: "Q4 : appels" },
  114: { label: "Q : appels ?",       phrase: "(répondre : oui, Hercule appelle pour vous)", next: "Urgence" },

  // ── S16 Urgence ──────────────────────────────────────────────
  115: { label: "Lien Stripe",        phrase: "Le lien de paiement est dans le chat.",  next: "Countdown 5 min" },
  116: { label: "Countdown 5:00",     phrase: "(timer actif — laisser courir)",         next: "Close" },

  // ── S17 Close ────────────────────────────────────────────────
  117: { label: "ZOOM/CHAT/PRIX disparaît", phrase: "Oubliez tout ça.",               next: "Places limitées" },
  118: { label: "Places limitées",    phrase: "Il y a 12 places. 9 sont prises.",       next: "Phrase finale" },
  119: { label: "Phrase finale",      phrase: "(silence) Les décisions de demain se prennent maintenant.", next: "Logo final" },
  120: { label: "Logo final",         phrase: "(silence)",                             next: "Écran offres" },

  // ── S18 Offres statiques ─────────────────────────────────────
  121: { label: "Offres — transition", phrase: "(laisser visible, répondre aux questions)", next: "Offres finales" },
  122: { label: "FIN — offres",       phrase: "(écran final statique, fin de présentation)", next: "—" },
};
