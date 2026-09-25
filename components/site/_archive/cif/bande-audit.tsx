import { CifMarketingPrimaryCta } from "@/components/site/cif/cif-marketing-cta"
import {
  getMarketingCopy,
  MARKETING_SECONDARY_CTA,
} from "@/lib/site/marketing-copy"

const copy = getMarketingCopy("cif")

export function BandeAudit() {
  return (
    <section id="contact" className="py-24 px-6" >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <p className="text-sm text-foreground mb-3 font-medium">{copy.bandeAudit.eyebrow}</p>
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-medium text-foreground tracking-tight">
              {copy.bandeAudit.title}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg">{copy.bandeAudit.intro}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href="#missions"
              className="px-5 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors text-sm"
            >
              {MARKETING_SECONDARY_CTA}
            </a>
            <CifMarketingPrimaryCta className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm" />
          </div>
        </div>
      </div>
    </section>
  )
}
