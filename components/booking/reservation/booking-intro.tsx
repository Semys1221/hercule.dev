"use client"

import { useEffect, useState } from "react"

type AvailabilityMessage = {
  prefix?: string
  fullFrom?: string
  middle?: string
  fullUntil?: string
  suffix?: string
  nextAvailable?: string
  end?: string
}

type AvailabilityResponse = {
  ok?: boolean
  isFullyBooked?: boolean
  message?: AvailabilityMessage
}

export function BookingIntro({
  event,
  fallback,
}: {
  event: "agence" | "entreprise"
  fallback: string
}) {
  const [message, setMessage] = useState<AvailabilityMessage | null>(null)
  const [fullyBooked, setFullyBooked] = useState(false)

  useEffect(() => {
    void fetch(`/api/calendly/availability?event=${encodeURIComponent(event)}`)
      .then(async (response) => {
        const data = (await response.json()) as AvailabilityResponse
        if (!response.ok || !data.ok || !data.isFullyBooked || !data.message) return
        setFullyBooked(true)
        setMessage(data.message)
      })
      .catch(() => {})
  }, [event])

  if (!fullyBooked || !message) {
    return (
      <p className="mb-5 max-w-[52ch] text-[15px] leading-relaxed text-zinc-400">
        {fallback}
      </p>
    )
  }

  return (
    <p className="mb-5 max-w-[52ch] text-[15px] leading-relaxed text-zinc-400" aria-live="polite">
      {message.prefix}
      {message.fullFrom ? (
        <span className="text-white">{message.fullFrom}</span>
      ) : null}
      {message.middle}
      {message.fullUntil ? (
        <span className="text-white">{message.fullUntil}</span>
      ) : null}
      {message.suffix}
      {message.nextAvailable ? (
        <span className="text-white">{message.nextAvailable}</span>
      ) : null}
      {message.end}
    </p>
  )
}
