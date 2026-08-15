"use client"

import { useCallback, useEffect, useState } from "react"
import * as tenantsService from "@/services/tenants.service"

export function useTenantName(tenantId?: string) {
  const [tenantName, setTenantName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const tenant = await tenantsService.getMyTenant()
      setTenantName(tenant.name)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    if (!tenantId) return
    void load()

    const handleVisibility = () => {
      if (document.visibilityState === "visible") void load()
    }
    const handleFocus = () => {
      void load()
    }

    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("focus", handleFocus)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("focus", handleFocus)
    }
  }, [tenantId, load])

  return { tenantName, loading, error }
}