export function CTASection() {
  return (
    <section id="contact" className="py-24 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm text-indigo-400 mb-3 font-medium">Première signature — 1 489 €</p>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-medium text-white tracking-tight">
              Structurer votre pipeline commercial
            </h2>
            <p className="mt-4 text-zinc-400 max-w-lg">
              Cinq rendez-vous qualifiés inclus. En l&apos;absence de signature, cinq nouveaux rendez-vous sont
              replanifiés. Rejoignez les agences qui concluent sans effort de prospection.
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
              href="#contact"
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm"
            >
              Planifier un échange
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
