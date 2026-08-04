"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertTriangle, Building2, CheckCircle2, Lock, Pencil, Unlock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { DashboardAreaChart, DonutChart, KpiCard } from "@/components/dashboard"
import { CHART_COLORS, formatDate } from "@/components/dashboard/chart-tools"
import { TenantFormDialog } from "@/components/tenants/tenant-form-dialog"
import {
  SkeletonChartGrid,
  SkeletonKpiGrid,
  SkeletonTable,
} from "@/components/ui/skeleton-patterns"
import * as tenantsService from "@/services/tenants.service"
import type { Tenant } from "@/types/tenant"

const statusBadge: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "outline" }> = {
  active: { label: "Activo", variant: "success" },
  suspended: { label: "Suspendido", variant: "destructive" },
  trial: { label: "Prueba", variant: "warning" },
}

const statusColors: Record<string, string> = {
  active: CHART_COLORS[4],
  suspended: "var(--destructive)",
  trial: CHART_COLORS[2],
}

function tenantInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function SuperAdminDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    tenantsService
      .getAll()
      .then((data) => {
        if (cancelled) return
        setTenants(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const counts = useMemo(
    () => ({
      total: tenants.length,
      active: tenants.filter((t) => t.status === "active").length,
      suspended: tenants.filter((t) => t.status === "suspended").length,
      trial: tenants.filter((t) => t.status === "trial").length,
    }),
    [tenants],
  )

  const monthlySeries = useMemo(() => {
    const byMonth = new Map<string, number>()
    for (const t of tenants) {
      const month = formatDate(t.createdAt, { month: "short" }).toLowerCase()
      byMonth.set(month, (byMonth.get(month) ?? 0) + 1)
    }
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth()
    const out: Array<{ key: string; label: string; count: number; revenue: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1)
      const label = formatDate(d, { month: "short" })
      const monthKey = label.toLowerCase()
      out.push({ key: monthKey, label, count: byMonth.get(monthKey) ?? 0, revenue: 0 })
    }
    return out
  }, [tenants])

const statusDonut = [
    { name: "Activos", value: counts.active, color: statusColors.active },
    { name: "Suspendidos", value: counts.suspended, color: statusColors.suspended },
    { name: "Prueba", value: counts.trial, color: statusColors.trial },
  ].filter((d) => d.value > 0)

  const activeSparkline = useMemo(() => {
    return monthlySeries.map((m) => m.count)
  }, [monthlySeries])

  const handleToggle = async (tenant: Tenant) => {
    setActionId(tenant.id)
    try {
      const updated =
        tenant.status === "suspended"
          ? await tenantsService.activate(tenant.id)
          : await tenantsService.suspend(tenant.id)
      setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      console.error("Error al cambiar estado del tenant:", err)
      setToggleError(err instanceof Error ? err.message : "No se pudo actualizar el estado del tenant.")
    } finally {
      setActionId(null)
    }
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setDialogOpen(true)
  }

  const handleSaved = (updated: Tenant) => {
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonKpiGrid cols={3} />
        <SkeletonChartGrid charts={2} />
        <SkeletonTable rows={5} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {toggleError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          <span className="flex-1">{toggleError}</span>
          <button
            className="text-sm font-medium underline-offset-2 hover:underline"
            onClick={() => setToggleError(null)}
            aria-label="Descartar"
          >
            Descartar
          </button>
        </div>
      )}
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total Tenants"
          value={counts.total}
          icon={<Building2 className="size-4 text-primary" />}
          color={CHART_COLORS[0]}
          sparkline={activeSparkline}
        />
        <KpiCard
          label="Activos"
          value={counts.active}
          trend={counts.total > 0 ? (counts.active / counts.total) * 100 : 0}
          trendLabel="del total"
          icon={<CheckCircle2 className="size-4 text-primary" />}
          color={CHART_COLORS[4]}
          sparkline={activeSparkline}
        />
        <KpiCard
          label="Suspendidos"
          value={counts.suspended}
          icon={<AlertTriangle className="size-4 text-primary" />}
          color={CHART_COLORS[2]}
          sparkline={monthlySeries.map(() => (counts.suspended > 0 ? counts.suspended : 0))}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardAreaChart
          title="Creación de tenants"
          description="Últimos 6 meses"
          series={monthlySeries}
          dataKey="count"
          color={CHART_COLORS[0]}
          className="lg:col-span-2"
        />
        <DonutChart
          title="Distribución por estado"
          description="Todos los tenants"
          data={statusDonut.length > 0 ? statusDonut : [{ name: "Sin datos", value: 1, color: "var(--border)" }]}
        />
      </div>

      {/* Tenants table */}
      <Card className="overflow-hidden rounded-xl border bg-card">
        <CardHeader className="border-b pb-3">
          <CardTitle>Tenants</CardTitle>
          <CardDescription>Gestión de estado de los tenants</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="py-3.5">Nombre</TableHead>
                <TableHead className="py-3.5">Email</TableHead>
                <TableHead className="py-3.5">Creado</TableHead>
                <TableHead className="py-3.5">Estado</TableHead>
                <TableHead className="py-3.5 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const s = statusBadge[tenant.status] ?? { label: tenant.status, variant: "outline" as const }
                return (
                  <TableRow key={tenant.id} className="transition-colors hover:bg-muted/20">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex size-9 items-center justify-center rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: statusColors[tenant.status] ?? "var(--muted-foreground)" }}
                        >
                          {tenantInitials(tenant.name)}
                        </div>
                        <div>
                          <p className="font-semibold">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">{tenant.email || "—"}</TableCell>
                    <TableCell className="py-3 text-muted-foreground">
                      {formatDate(tenant.createdAt)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => handleEdit(tenant)}
                                aria-label="Editar tenant"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className={tenant.status === "suspended" ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-destructive"}
                                disabled={actionId === tenant.id}
                                onClick={() => handleToggle(tenant)}
                                aria-label={tenant.status === "suspended" ? "Activar tenant" : "Suspender tenant"}
                              >
                                {tenant.status === "suspended" ? (
                                  <Unlock className="size-4" />
                                ) : (
                                  <Lock className="size-4" />
                                )}
                              </Button>
                            }
                          />
                          <TooltipContent>
                            {tenant.status === "suspended" ? "Activar" : "Suspender"}
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <TenantFormDialog
        mode="edit"
        tenant={editingTenant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />
    </div>
  )
}
