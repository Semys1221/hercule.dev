import { CALENDLY_AGENCE_URL } from "@/lib/constants"
import { MarketingBookingCta } from "@/components/site/marketing-booking-cta"
import { getMarketingCopy } from "@/lib/site/marketing-copy"

const copy = getMarketingCopy("agence")

export function BandeAudit() {
  return (
    <section id="contact" className="py-24 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm text-indigo-400 mb-3 font-medium">{copy.bandeAudit.eyebrow}</p>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-medium text-white tracking-tight">
              {copy.bandeAudit.title}
            </h2>
            <p className="mt-4 text-zinc-400 max-w-lg">{copy.bandeAudit.intro}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#pricing"
              className="px-5 py-2.5 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors text-sm"
            >
              Consulter la tarification
            </a>
            <MarketingBookingCta
              href={CALENDLY_AGENCE_URL}
              className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
