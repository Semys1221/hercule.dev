import Image from "next/image"
import Link from "next/link"

import { HouseDocument } from "@/components/site/house/house-document"
import { TEAM_IMAGE_URL } from "@/lib/constants"

const TEAM = [
  { name: "Evan", role: "Direction du groupement et vision produit." },
  { name: "Béatrice", role: "Qualification des projets et relation avec les cabinets partenaires." },
  { name: "Thomas", role: "Produit et opérations techniques." },
] as const

export function HouseAbout() {
  return (
    <HouseDocument audience="home" backHref="/" backLabel="Retour à l'accueil">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border">
        <Image src={TEAM_IMAGE_URL} alt="Équipe Hercule" fill className="object-cover" />
      </div>
      <div className="flex flex-col gap-8">
        <p className="text-lg text-muted-foreground">
          Hercule est un groupement d&apos;entreprises qui qualifie les projets B2B et les attribue en
          exclusivité aux partenaires compatibles.
        </p>
        <div className="grid gap-6 sm:grid-cols-3">
          {TEAM.map((member) => (
            <div key={member.name} className="flex flex-col gap-2">
              <p className="font-medium text-foreground">{member.name}</p>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          <Link href="/faq" className="underline-offset-4 hover:underline">
            FAQ
          </Link>
        </p>
      </div>
    </HouseDocument>
  )
}
