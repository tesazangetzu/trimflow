"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { getAvailability } from "@/services/public.service"
import type { PublicSlot } from "@/types/public"

export function useAvailability(
  slug: string,
  serviceId: string | null,
  barberId: string | null,
  date: string,
) {
  const [slots, setSlots] = useState<PublicSlot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug || !serviceId || !barberId || !date) {
      setSlots([])
      setLoading(false)
      setError(null)
      return
    }

    const controller = new AbortController()
    let active = true

    setLoading(true)
    setError(null)

    getAvailability(slug, serviceId, barberId, date, controller.signal)
      .then((res) => {
        if (active) setSlots(res.slots ?? [])
      })
      .catch((err) => {
        if (active && !axios.isCancel(err)) {
          setSlots([])
          setError("No se pudieron cargar los horarios disponibles.")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [slug, serviceId, barberId, date])

  return { slots, loading, error }
}