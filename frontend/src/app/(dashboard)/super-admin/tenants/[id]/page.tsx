"use client"

import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import * as tenantsService from "@/services/tenants.service"
import type { Tenant } from "@/types/tenant"
import { SkeletonDetail } from "@/components/ui/skeleton-patterns"

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)

  useEffect(() => {
    tenantsService.getById(id).then(setTenant)
  }, [id])

  if (!tenant) return <div className="max-w-2xl space-y-6"><SkeletonDetail formRows={4} /></div>

  const handleActivate = async () => {
    await tenantsService.activate(id)
    setTenant({ ...tenant, status: "active" })
  }

  const handleSuspend = async () => {
    await tenantsService.suspend(id)
    setTenant({ ...tenant, status: "suspended" })
  }

  const statusColor = tenant.status === "active" ? "success" : "destructive"

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1>{tenant.name}</h1>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalle del Tenant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-sm text-muted-foreground">Slug:</span>
            <p>{tenant.slug}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Email:</span>
            <p>{tenant.email || "—"}</p>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Estado:</span>
            <div className="mt-1">
              <Badge variant={statusColor}>{tenant.status}</Badge>
            </div>
          </div>
          <div>
            <span className="text-sm text-muted-foreground">Creado:</span>
            <p>{new Date(tenant.createdAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-4 pt-4">
            {tenant.status !== "active" && (
              <Button onClick={handleActivate}>Activar</Button>
            )}
            {tenant.status !== "suspended" && (
              <Button variant="destructive" onClick={handleSuspend}>
                Suspender
              </Button>
            )}
            <Button variant="outline" onClick={() => router.push("/super-admin/tenants")}>
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
