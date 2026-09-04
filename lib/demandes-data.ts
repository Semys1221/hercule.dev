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
  origine: string
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

export function getDemandesVisibles(
  demandes: DemandeContrat[],
  date: Date = new Date(),
): DemandeContrat[] {
  return demandes.filter((demande) => isDemandeActive(demande, date))
}
