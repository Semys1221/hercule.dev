"use client"

import { useEffect } from "react"

export function HouseScrollCvg({ sectionId }: { sectionId: string }) {
  useEffect(() => {
    const resolved = sectionId === "hubris-imperial" ? "hubris" : sectionId
    const el =
      document.getElementById(resolved) ??
      (resolved === "hubris" ? document.getElementById("hubris-imperial") : null)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      window.history.replaceState(null, "", `/cvg#${resolved}`)
    }
  }, [sectionId])
  return null
}
