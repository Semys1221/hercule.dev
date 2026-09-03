export type DemandeNiche =
  | "comptabilite"
  | "conseil-financier"
  | "renovation"
  | "grossiste"
  | "a-venir"

export type DemandeStatus = "available" | "assigned"

export interface DemandeContrat {
  id: string
  niche: DemandeNiche
  secteur: string
  availableFrom: string
  availableUntil: string
  prestation: string
  budget: string
  taille: string
  zone: string
  disponibilite: string
  status: DemandeStatus
  masked: true
}

export interface DemandeTeaser {
  id: string
  niche: "a-venir"
  secteur: string
  titre: string
  description: string
  note: string
}

export const DEMANDES: DemandeContrat[] = [
  // Vague 1 — Comptabilité (8 → 27 septembre 2026)
  {
    id: "C1",
    niche: "comptabilite",
    secteur: "Comptabilité",
    availableFrom: "2026-09-08",
    availableUntil: "2026-09-27",
    prestation: "Acquisition SEO + optimisation du site",
    budget: "1 500–2 500 €/mois",
    taille: "8 mandataires",
    zone: "Grand Est",
    disponibilite: "Septembre",
    status: "available",
    masked: true,
  },
  {
    id: "C2",
    niche: "comptabilite",
    secteur: "Comptabilité",
    availableFrom: "2026-09-08",
    availableUntil: "2026-09-27",
    prestation: "Refonte site vitrine + acquisition",
    budget: "4 000–7 000 €",
    taille: "24 collaborateurs",
    zone: "PACA",
    disponibilite: "Septembre",
    status: "assigned",
    masked: true,
  },
  {
    id: "C3",
    niche: "comptabilite",
    secteur: "Comptabilité",
    availableFrom: "2026-09-08",
    availableUntil: "2026-09-27",
    prestation: "SEO local + création de contenus",
    budget: "1 500–2 500 €/mois",
    taille: "11 mandataires",
    zone: "Occitanie",
    disponibilite: "Septembre",
    status: "available",
    masked: true,
  },
  {
    id: "C4",
    niche: "comptabilite",
    secteur: "Comptabilité",
    availableFrom: "2026-09-08",
    availableUntil: "2026-09-27",
    prestation: "Acquisition SEO + SEA",
    budget: "2 000–3 500 €/mois",
    taille: "37 collaborateurs",
    zone: "Île-de-France",
    disponibilite: "Septembre",
    status: "available",
    masked: true,
  },
  // Vague 2 — Conseil financier (16 septembre → 5 novembre 2026)
  {
    id: "F1",
    niche: "conseil-financier",
    secteur: "Conseil financier",
    availableFrom: "2026-09-16",
    availableUntil: "2026-11-05",
    prestation: "Refonte site + positionnement digital",
    budget: "5 000–8 000 €",
    taille: "6 conseillers",
    zone: "Île-de-France",
    disponibilite: "Septembre",
    status: "assigned",
    masked: true,
  },
  {
    id: "F2",
    niche: "conseil-financier",
    secteur: "Conseil financier",
    availableFrom: "2026-09-16",
    availableUntil: "2026-11-05",
    prestation: "SEO + contenu B2B",
    budget: "1 800–3 000 €/mois",
    taille: "18 collaborateurs",
    zone: "France",
    disponibilite: "Octobre",
    status: "available",
    masked: true,
  },
  {
    id: "F3",
    niche: "conseil-financier",
    secteur: "Conseil financier",
    availableFrom: "2026-09-16",
    availableUntil: "2026-11-05",
    prestation: "Acquisition payante + landing pages",
    budget: "2 000–3 500 €/mois",
    taille: "9 conseillers",
    zone: "Auvergne-Rhône-Alpes",
    disponibilite: "Octobre",
    status: "available",
    masked: true,
  },
  {
    id: "F4",
    niche: "conseil-financier",
    secteur: "Conseil financier",
    availableFrom: "2026-09-16",
    availableUntil: "2026-11-05",
    prestation: "Site institutionnel + prise de rendez-vous",
    budget: "3 500–6 000 €",
    taille: "14 collaborateurs",
    zone: "Occitanie",
    disponibilite: "Octobre",
    status: "available",
    masked: true,
  },
  {
    id: "F5",
    niche: "conseil-financier",
    secteur: "Conseil financier",
    availableFrom: "2026-09-16",
    availableUntil: "2026-11-05",
    prestation: "Acquisition digitale complète",
    budget: "2 500–4 000 €/mois",
    taille: "31 collaborateurs",
    zone: "France",
    disponibilite: "Novembre",
    status: "available",
    masked: true,
  },
  // Vague 3 — Rénovation & services aux entreprises (25 octobre → 19 novembre 2026)
  {
    id: "R1",
    niche: "renovation",
    secteur: "Solaire",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "Site + génération de demandes de devis",
    budget: "4 000–7 000 €",
    taille: "18 salariés",
    zone: "Nouvelle-Aquitaine",
    disponibilite: "Octobre–Novembre",
    status: "available",
    masked: true,
  },
  {
    id: "R2",
    niche: "renovation",
    secteur: "Pompe à chaleur",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "Landing pages + acquisition payante",
    budget: "1 800–3 000 €/mois",
    taille: "12 salariés",
    zone: "France",
    disponibilite: "Octobre–Novembre",
    status: "available",
    masked: true,
  },
  {
    id: "R3",
    niche: "renovation",
    secteur: "Piscines",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "Refonte site + génération de leads",
    budget: "4 000–7 000 €",
    taille: "9 salariés",
    zone: "PACA",
    disponibilite: "Octobre–Novembre",
    status: "assigned",
    masked: true,
  },
  {
    id: "R4",
    niche: "renovation",
    secteur: "Rénovation énergétique",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "SEO + acquisition locale",
    budget: "1 500–2 500 €/mois",
    taille: "42 salariés",
    zone: "France",
    disponibilite: "Octobre–Novembre",
    status: "available",
    masked: true,
  },
  {
    id: "G1",
    niche: "grossiste",
    secteur: "Grossiste emballage",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "Refonte e-commerce B2B",
    budget: "8 000–15 000 €",
    taille: "27 salariés",
    zone: "France",
    disponibilite: "Octobre–Novembre",
    status: "available",
    masked: true,
  },
  {
    id: "G2",
    niche: "grossiste",
    secteur: "Fournitures médicales",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "Site B2B + espace professionnel",
    budget: "7 000–12 000 €",
    taille: "53 salariés",
    zone: "France",
    disponibilite: "Octobre–Novembre",
    status: "available",
    masked: true,
  },
  {
    id: "G3",
    niche: "grossiste",
    secteur: "Distribution professionnelle",
    availableFrom: "2026-10-25",
    availableUntil: "2026-11-19",
    prestation: "Acquisition B2B + refonte site",
    budget: "3 000–5 000 €/mois",
    taille: "16 salariés",
    zone: "Europe",
    disponibilite: "Octobre–Novembre",
    status: "available",
    masked: true,
  },
]

export const DEMANDE_TEASER: DemandeTeaser = {
  id: "AVENIR-SANTE",
  niche: "a-venir",
  secteur: "Santé esthétique",
  titre: "Santé esthétique",
  description: "Cliniques esthétiques, centres laser et médecine esthétique.",
  note: "Les prochaines demandes seront ajoutées au fur et à mesure de leur qualification.",
}

function toDateOnly(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function isDemandeActive(demande: DemandeContrat, date: Date = new Date()): boolean {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const from = toDateOnly(demande.availableFrom)
  const until = toDateOnly(demande.availableUntil)
  return today >= from && today <= until
}

export function getDemandesVisibles(date: Date = new Date()): DemandeContrat[] {
  return DEMANDES.filter((demande) => isDemandeActive(demande, date))
}

export function getDemandesCarousel(): DemandeContrat[] {
  return [...DEMANDES]
}

export function getAssignedDemandesCount(): number {
  return DEMANDES.filter((demande) => demande.status === "assigned").length
}
