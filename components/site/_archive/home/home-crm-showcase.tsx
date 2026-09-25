"use client"

import dynamic from "next/dynamic"

const ApercuCrm = dynamic(
  () =>
    import("@/components/site/comptable/apercu-crm").then((mod) => mod.ApercuCrm),
  { ssr: false },
)

const baseTransform = {
  translateX: 2,
  scale: 1.2,
  rotateX: 47,
  rotateY: 31,
  rotateZ: 324,
}

export function HomeCrmShowcase() {
  return (
    <section className="house-archive-section relative overflow-hidden bg-background py-24">
      <div className="pointer-events-none relative mx-auto h-[min(52vh,520px)] w-full max-w-[1440px] px-8 md:px-16">
        <div
          className="absolute inset-x-8 bottom-0 top-8 overflow-hidden rounded-xl border border-border bg-card shadow-lg md:inset-x-16"
          style={{
            transform: `translate(${baseTransform.translateX}%) scale(${baseTransform.scale * 0.85}) rotateX(${baseTransform.rotateX}deg) rotateY(${baseTransform.rotateY}deg) rotate(${baseTransform.rotateZ}deg)`,
            transformOrigin: "center top",
            transformStyle: "preserve-3d",
          }}
        >
          <ApercuCrm />
        </div>
      </div>
    </section>
  )
}
