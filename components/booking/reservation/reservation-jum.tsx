"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { CalendlyInline } from "@/components/booking/reservation/calendly-inline"
import { useReservationSession } from "@/components/booking/reservation/use-reservation-session"
import {
  buildCalendlySchedulingUrl,
  JUM_PORTRAIT_URL,
} from "@/lib/legacy/booking/reservation-surface"

type ReservationJumProps = {
  slug: string
  email: string
  calendlyUrl: string
}

function formatNextSlotLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  const dayMonth = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
  }).format(date)
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date)
  const hour = parts.find((part) => part.type === "hour")?.value ?? "0"
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00"
  const timeLabel = minute === "00" ? `${hour}h` : `${hour}h${minute}`
  return `Prochaine disponibilité le ${dayMonth} à ${timeLabel}`
}

export function ReservationJum({ slug, email, calendlyUrl }: ReservationJumProps) {
  const session = useReservationSession({
    slug,
    calendlyUrl,
    pageTitle: "Réserver un créneau · JUM Advisory",
    confirmedTitle: "Rendez-vous confirmé · JUM Advisory",
  })
  const widgetUrl = buildCalendlySchedulingUrl(session.calendlyUrl, { email, slug })
  const [nextSlot, setNextSlot] = useState("Prochaine disponibilité le …")

  useEffect(() => {
    void fetch("/api/calendly/next-slots?event=jum&count=1")
      .then(async (response) => {
        const data = (await response.json()) as {
          ok?: boolean
          slots?: Array<{ iso?: string }>
        }
        const iso = data.slots?.[0]?.iso
        if (!response.ok || !data.ok || !iso) return
        const label = formatNextSlotLabel(iso)
        if (label) setNextSlot(label)
      })
      .catch(() => {})
  }, [])

  return (
    <div
      className="min-h-screen bg-[#f4f5f7] font-[family-name:var(--font-jum-sans)] text-[#14181f]"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(180, 195, 215, 0.28), transparent 60%), linear-gradient(180deg, #f4f5f7 0%, #eceef2 100%)",
      }}
    >
      <div className="mx-auto max-w-[960px] px-5 py-8">
        <header className="mb-6 text-center">
          <div className="font-[family-name:var(--font-jum-serif)] text-[28px] font-semibold tracking-[0.08em]">
            JUM
          </div>
        </header>
        {session.confirmed ? null : (
          <div className="mb-7 text-center">
            <h1 className="mb-3 text-[clamp(28px,4.5vw,40px)] font-normal tracking-tight">
              Réserver votre échange
            </h1>
            <h2 className="m-0 text-[clamp(15px,2vw,18px)] font-normal text-[#5c6570]">
              {nextSlot}
            </h2>
          </div>
        )}
        <div className="min-h-[620px] overflow-hidden rounded-[20px] border border-white/45 bg-white/72 shadow-[0_20px_60px_rgba(20,30,50,0.08)] backdrop-blur-md">
          {session.confirmed ? (
            <div className="grid min-h-[480px] grid-cols-1 md:grid-cols-[minmax(220px,42%)_1fr]">
              <div className="h-60 bg-[#d8dde5] md:h-auto">
                <img
                  src={JUM_PORTRAIT_URL}
                  alt="Équipe JUM Advisory"
                  className="block h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col justify-center px-9 py-10 text-left">
                <span className="mb-3.5 inline-block self-start rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide">
                  Rendez-vous confirmé
                </span>
                <h2 className="mb-3 font-[family-name:var(--font-jum-serif)] text-[clamp(24px,3.5vw,30px)] font-semibold">
                  Votre rendez-vous est confirmé
                </h2>
                <p className="mb-7 max-w-[36ch] text-[15px] leading-relaxed text-[#5c6570]">
                  Vous recevrez une confirmation par email avec le lien de connexion Calendly.
                  Merci de votre confiance.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="self-start rounded-full border-black/10 bg-white text-[#1a1f28]"
                >
                  <a href="https://jum-advisory.com" target="_blank" rel="noopener noreferrer">
                    Découvrir JUM Advisory
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <CalendlyInline
              url={widgetUrl}
              onScheduled={session.markConfirmed}
              tone="light"
              className="min-h-[620px]"
            />
          )}
        </div>
      </div>
    </div>
  )
}
