"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ApercuCrm } from "./apercu-crm"
import { Navbar } from "./navbar"
import { BandeStack } from "./bande-stack"
import { PilierMatching } from "./pilier-matching"
import { BandeProjets } from "./bande-projets"
import { AuditLive } from "./audit-live"
import { GrillePipeline } from "./grille-pipeline"
import { MethodeRadar } from "./methode-radar"
import { BlocGaranties } from "./bloc-garanties"
import { BandeAudit } from "./bande-audit"
import { Footer } from "./footer"
import type { DemandeContrat, DemandeTeaser } from "@/lib/demandes-data"

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

export function AccueilScene({ demandes, teaser }: AccueilSceneProps) {
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
                Nous trouvons le bon cabinet pour chaque mission PME.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-6 text-lg text-zinc-400"
              >
                Hercule reçoit et qualifie des demandes de dirigeants PME, puis sélectionne les cabinets CIF adaptés pour leur attribuer des missions d'optimisation fiscale et de trésorerie.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 flex flex-wrap items-center gap-6"
              >
                <a
                  href="#demandes"
                  className="px-5 py-2.5 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors text-sm"
                >
                  Voir les missions disponibles
                </a>
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

          <BandeStack />
          <BandeProjets demandes={demandes} teaser={teaser} />
          <PilierMatching />
          <AuditLive />
          <GrillePipeline demandes={demandes} />
          <MethodeRadar />
          <BlocGaranties />
          <BandeAudit />
          <Footer />
        </div>
      </section>
    </>
  )
}
