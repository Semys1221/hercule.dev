import { CALENDLY_ENTREPRISE_URL } from "@/lib/constants"

export function BandeAgence() {
  return (
    <section id="contact" className="py-24 px-6 scroll-mt-24" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm text-emerald-400 mb-3 font-medium">Service gratuit pour les entreprises</p>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-medium text-white tracking-tight">
              Décrivez votre besoin, nous trouvons une agence adaptée.
            </h2>
            <p className="mt-4 text-zinc-400 max-w-lg">
              Vous n&apos;avez rien à perdre à essayer : qualification gratuite, sélection sur mesure, mise en
              relation organisée.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#modele"
              className="px-5 py-2.5 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors text-sm"
            >
              Comprendre notre modèle
            </a>
            <a
              href={CALENDLY_ENTREPRISE_URL}
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm"
            >
              Trouver mon agence
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
