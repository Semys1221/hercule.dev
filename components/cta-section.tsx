import { CALENDLY_URL } from "@/lib/constants"

export function CTASection() {
  return (
    <section id="contact" className="py-24 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm text-indigo-400 mb-3 font-medium">Des demandes clients en attente d&apos;attribution</p>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-medium text-white tracking-tight">
              Demandez votre audit de compatibilité
            </h2>
            <p className="mt-4 text-zinc-400 max-w-lg">
              Des demandes qualifiées attendent une agence compatible. Vérifions ensemble si votre profil correspond
              à nos attributions en cours.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#pricing"
              className="px-5 py-2.5 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors text-sm"
            >
              Consulter la tarification
            </a>
            <a
              href={CALENDLY_URL}
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm"
            >
              Demander des apports d&apos;affaires
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
