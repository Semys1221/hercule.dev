import Image from "next/image"
import Link from "next/link"

import { Navbar } from "@/components/site/home/navbar"
import { Footer } from "@/components/site/home/footer"
import { TEAM_IMAGE_URL } from "@/lib/constants"

const TEAM = [
  {
    name: "Evan",
    role: "Direction du groupement et vision produit.",
  },
  {
    name: "Béatrice",
    role: "Qualification des projets et relation avec les cabinets partenaires.",
  },
  {
    name: "Thomas",
    role: "Produit et opérations techniques.",
  },
] as const

export function CompanyAbout() {
  return (
    <div  className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-6">
        <div className="mx-auto w-full max-w-[1440px] px-8 md:px-16">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-block">
            ← Retour à l&apos;accueil
          </Link>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl text-foreground mb-8"
            style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
          >
            La société Hercule
          </h1>

          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-border mb-10">
            <Image
              src={TEAM_IMAGE_URL}
              alt="L'équipe Hercule"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>

          <div className="space-y-4 text-muted-foreground text-sm leading-relaxed mb-12">
            <p>
              Hercule est née du logiciel que nous avions développé pour notre propre activité de développement
              commercial. Ce que nous avions construit en interne pour alimenter notre croissance est devenu le socle
              de la plateforme.
            </p>
            <p>
              Aujourd&apos;hui, nous réalisons du courtage de projets B2B pour les comptables, courtiers financiers et
              courtiers en assurance : qualification des demandes des dirigeants TPE, PME et indépendants (BNC, BIC,
              TNS) et attribution exclusive sur zone — pas une marketplace de leads.
            </p>
          </div>

          <h2 className="text-xl text-foreground font-medium tracking-tight mb-6">L&apos;équipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TEAM.map((member) => (
              <div key={member.name} className="rounded-xl border border-border bg-muted/40 p-5">
                <p className="text-foreground font-medium mb-2">{member.name}</p>
                <p className="text-muted-foreground text-sm leading-relaxed">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
