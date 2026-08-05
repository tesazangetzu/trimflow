"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { getShop } from "@/services/public.service"
import type { PublicShop } from "@/types/public"

export function usePublicData(slug: string) {
  const [shop, setShop] = useState<PublicShop | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setNotFound(false)
    try {
      const shopData = await getShop(slug)
      setShop(shopData)
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        setNotFound(true)
        setShop(null)
      } else if (axios.isCancel(err)) {
        // cancelado
      } else {
        setError("No se pudo cargar la barbería. Inténtalo de nuevo.")
      }
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    load()
  }, [load])

  return { shop, loading, notFound, error, reload: load }
}