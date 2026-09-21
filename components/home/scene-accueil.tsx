"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ApercuCrm } from "@/components/comptable/apercu-crm"
import { Navbar } from "@/components/home/navbar"
import { Footer } from "@/components/home/footer"
import { BandeStack } from "@/components/comptable/bande-stack"
import { PilierMatching } from "@/components/comptable/pilier-matching"
import { BandeProjets } from "@/components/comptable/bande-projets"
import { AuditLive } from "@/components/comptable/audit-live"
import { GrillePipeline } from "@/components/comptable/grille-pipeline"
import { MethodeRadar } from "@/components/comptable/methode-radar"
import { BlocGaranties } from "@/components/comptable/bloc-garanties"
import { BandeAudit } from "@/components/comptable/bande-audit"
import type { DemandeContrat, DemandeTeaser } from "@/lib/demandes-data"
import { CALENDLY_CIF_CONFERENCE_URL } from "@/lib/constants"
import {
  getMarketingCopy,
  HERO_CTA_COMPTABLE,
  HERO_CTA_CONFERENCE,
  HERO_CTA_COURTIER_ASSURANCE,
  HERO_CTA_COURTIER_FINANCIER,
  HERO_EVENT_BADGE,
  HERO_EVENT_DATE,
  HERO_EVENT_SUBLINE,
} from "@/lib/site/marketing-copy"

interface AccueilSceneProps {
  demandes: DemandeContrat[]
  teaser: DemandeTeaser | null
}

const baseTransform = {
  translateX: 2,
  scale: 1.2,
  rotateX: 47,
  rotateY: 31,
  rotateZ: 324,
}

const HERO_PERSONA_CTAS = [
  { href: "/conseil-financier", label: HERO_CTA_COURTIER_FINANCIER },
  { href: "/comptable", label: HERO_CTA_COMPTABLE },
  { href: "/courtier-assurance", label: HERO_CTA_COURTIER_ASSURANCE },
] as const

export function AccueilScene({ demandes, teaser }: AccueilSceneProps) {
  const copy = getMarketingCopy("generic")
  const [yOffset, setYOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const offset = Math.min(scrollY / 300, 1) * -20
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
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -30%)",
            width: "1200px",
            height: "800px",
            background: "radial-gradient(ellipse at center, rgba(16, 185, 129, 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 pt-28 flex flex-col">
          <div className="relative z-20 w-full flex justify-center px-6 mt-16">
            <div className="w-full max-w-4xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-5xl lg:text-[56px] font-medium text-white leading-[1.1] text-balance"
              >
                {copy.hero.title}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-lg text-zinc-400"
              >
                {copy.hero.subtitle}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 rounded-2xl border border-indigo-500/35 bg-gradient-to-br from-indigo-500/15 to-zinc-900/50 p-6 text-center"
              >
                <span className="inline-block rounded-full border border-indigo-500/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-indigo-300">
                  {HERO_EVENT_BADGE}
                </span>
                <p className="mt-4 text-xl font-medium tracking-tight text-white md:text-[22px]">
                  {HERO_EVENT_DATE}
                  <span className="mt-1.5 block text-[13px] font-normal text-zinc-400">
                    heure de Paris
                  </span>
                </p>
                <p className="mt-3 text-sm text-zinc-400">{HERO_EVENT_SUBLINE}</p>
                <Link
                  href={CALENDLY_CIF_CONFERENCE_URL}
                  className="mt-5 inline-flex px-5 py-2.5 bg-indigo-500 text-white font-medium rounded-lg hover:bg-indigo-400 transition-colors text-sm"
                >
                  {HERO_CTA_CONFERENCE}
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-6 flex flex-col gap-3"
              >
                <p className="text-xs uppercase tracking-widest text-zinc-500">Je suis…</p>
                <div className="flex flex-wrap items-center gap-3">
                  {HERO_PERSONA_CTAS.map((cta) => (
                    <Link
                      key={cta.href}
                      href={cta.href}
                      className="px-5 py-2.5 border border-zinc-700 text-white font-medium rounded-lg hover:bg-zinc-800 transition-colors text-sm"
                    >
                      {cta.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          <div
            className="relative mt-16 pointer-events-none [&_*]:pointer-events-none"
            style={{
              width: "100vw",
              marginLeft: "-50vw",
              marginRight: "-50vw",
              position: "relative",
              left: "50%",
              right: "50%",
              height: "700px",
              marginTop: "-60px",
            }}
          >
            <div
              className="absolute bottom-0 left-0 right-0 h-72 z-10 pointer-events-none"
              style={{
                background: "linear-gradient(to top, #09090B 20%, transparent 100%)",
              }}
            />

            <div
              style={{
                transform: `translateY(${yOffset}px)`,
                transition: "transform 0.1s ease-out",
                contain: "strict",
                perspective: "4000px",
                perspectiveOrigin: "100% 0",
                width: "100%",
                height: "100%",
                transformStyle: "preserve-3d",
                position: "relative",
              }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.5,
                  duration: 1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  backgroundColor: "#09090B",
                  transformOrigin: "0 0",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  border: "1px solid #1e1e1e",
                  borderRadius: "10px",
                  width: "1600px",
                  height: "900px",
                  margin: "280px auto auto",
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  transform: `translate(${baseTransform.translateX}%) scale(${baseTransform.scale}) rotateX(${baseTransform.rotateX}deg) rotateY(${baseTransform.rotateY}deg) rotate(${baseTransform.rotateZ}deg)`,
                  transformStyle: "preserve-3d",
                  overflow: "hidden",
                }}
              >
                <ApercuCrm />
              </motion.div>
            </div>
          </div>

          <BandeStack audience="generic" />
          <BandeProjets demandes={demandes} teaser={teaser} audience="generic" />
          <PilierMatching audience="generic" />
          <AuditLive audience="generic" />
          <GrillePipeline demandes={demandes} audience="generic" />
          <MethodeRadar audience="generic" />
          <BlocGaranties audience="generic" />
          <BandeAudit audience="generic" />
          <Footer />
        </div>
      </section>
    </>
  )
}
