"use client"

import { useCallback, useEffect, useState } from "react"

import { calendlyUrlForJumSegment } from "@/lib/legacy/admin/niches/jum-verticals"

type ClickResponse = {
  ok?: boolean
  category?: string
  segment?: string | null
}

export function useReservationSession(params: {
  slug: string
  pageTitle: string
  confirmedTitle: string
  calendlyUrl: string
}) {
  const [confirmed, setConfirmed] = useState(false)
  const [calendlyUrl, setCalendlyUrl] = useState(params.calendlyUrl)

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    if (search.get("confirmed") === "1") {
      setConfirmed(true)
    }
  }, [])

  useEffect(() => {
    document.title = confirmed ? params.confirmedTitle : params.pageTitle
  }, [confirmed, params.confirmedTitle, params.pageTitle])

  useEffect(() => {
    if (!params.slug) return
    void fetch("/api/link-tracking/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: params.slug }),
    })
      .then(async (response) => {
        if (!response.ok) return
        const data = (await response.json()) as ClickResponse
        if (data.segment) {
          setCalendlyUrl(calendlyUrlForJumSegment(data.segment))
        }
      })
      .catch(() => {})
  }, [params.slug])

  const markConfirmed = useCallback(() => {
    setConfirmed(true)
    const query = new URLSearchParams(window.location.search)
    query.set("confirmed", "1")
    if (params.slug) query.set("code", params.slug)
    window.history.replaceState(null, "", `?${query.toString()}`)
  }, [params.slug])

  return { confirmed, calendlyUrl, markConfirmed }
}
