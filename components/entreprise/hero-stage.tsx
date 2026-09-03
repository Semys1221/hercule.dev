"use client"

import { useState, useEffect, type MouseEvent } from "react"
import { motion } from "framer-motion"
import { Navbar } from "./navbar"
import { HowItWorksSection } from "./how-it-works-section"
import { TransparencySection } from "./transparency-section"
import { BenefitsSection } from "./benefits-section"
import { CTASection } from "./cta-section"
import { Footer } from "./footer"
import { CALENDLY_ENTREPRISE_URL } from "@/lib/constants"

function scrollToMethode(e: MouseEvent<HTMLAnchorElement>) {
  e.preventDefault()
  const el = document.getElementById("methode")
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - 80
  window.scrollTo({ top, behavior: "smooth" })
}

export function HeroStage() {
  const [yOffset, setYOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const offset = Math.min(scrollY / 300, 1) * -12
      setYOffset(offset)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <section className="relative min-h-screen overflow-hidden" style={{ backgroundColor: "#09090B" }}>
        <Navbar />

        <div
          className="absolute pointer-events-none"
          style={{
            top: "40%",
            left: "50%",
            transform: `translate(-50%, calc(-30% + ${yOffset}px))`,
            width: "900px",
            height: "600px",
            background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 pt-28 flex flex-col">
          <div className="relative z-20 w-full flex justify-center px-6 mt-16 pb-24">
            <div className="w-full max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 mb-8"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-emerald-300 text-sm font-medium">Service gratuit pour les entreprises</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05 }}
                className="text-4xl md:text-5xl lg:text-[56px] font-medium text-white leading-[1.1] text-balance"
              >
                Trouvez la bonne agence, sans frais.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-lg text-zinc-400 max-w-2xl"
              >
                Décrivez votre besoin. Hercule qualifie votre projet et sélectionne les agences les plus adaptées à
                votre situation.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 flex flex-wrap items-center gap-6"
              >
                <a
                  href={CALENDLY_ENTREPRISE_URL}
                  className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm"
                >
                  Trouver mon agence
                </a>
                <a
                  href="#methode"
                  onClick={scrollToMethode}
                  className="text-zinc-300 font-medium hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  Comment ça fonctionne
                  <span aria-hidden="true">→</span>
                </a>
              </motion.div>
            </div>
          </div>

          <HowItWorksSection />
          <TransparencySection />
          <BenefitsSection />
          <CTASection />
          <Footer />
        </div>
      </section>
    </>
  )
}
