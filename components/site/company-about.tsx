import Image from "next/image"
import Link from "next/link"

import { Navbar } from "@/components/agence/navbar"
import { Footer } from "@/components/agence/footer"
import { TEAM_IMAGE_URL } from "@/lib/constants"

const TEAM = [
  {
    name: "Evan",
    role: "Direction du groupement et vision produit.",
  },
  {
    name: "Béatrice",
    role: "Qualification des demandes et relation avec les agences partenaires.",
  },
  {
    name: "Thomas",
    role: "Produit et opérations techniques.",
  },
] as const

export function CompanyAbout() {
  return (
    <div style={{ backgroundColor: "#09090B" }} className="min-h-screen">
      <Navbar />
      <main className="pt-28 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-8 inline-block">
            ← Retour à l&apos;accueil
          </Link>

          <h1
            className="text-3xl sm:text-4xl md:text-5xl text-white mb-8"
            style={{ letterSpacing: "-0.04em", fontWeight: 538, lineHeight: 1.1 }}
          >
            La société Hercule
          </h1>

          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl border border-zinc-800 mb-10">
            <Image
              src={TEAM_IMAGE_URL}
              alt="L'équipe Hercule"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>

          <div className="space-y-4 text-zinc-400 text-sm leading-relaxed mb-12">
            <p>
              Hercule est née du logiciel que nous avions développé pour notre propre activité de développement
              commercial. Ce que nous avions construit en interne pour alimenter notre croissance est devenu le socle
              de la plateforme.
            </p>
            <p>
              Aujourd&apos;hui, nous générons plus de 20 demandes clients qualifiées par mois dans différents secteurs.
              Nous auditons et qualifions les agences partenaires pour mettre en relation ces demandes avec les
              profils les plus compatibles.
            </p>
          </div>

          <h2 className="text-xl text-white font-medium tracking-tight mb-6">L&apos;équipe</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {TEAM.map((member) => (
              <div key={member.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5">
                <p className="text-white font-medium mb-2">{member.name}</p>
                <p className="text-zinc-500 text-sm leading-relaxed">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
