"use client"

import { useEffect, useMemo, useState } from "react"
import { Banknote, CalendarCheck, Coins, UserCog } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DashboardAreaChart,
  DonutChart,
  KpiCard,
  LocationsOverview,
  TransactionsTable,
} from "@/components/dashboard"
import {
  buildDailySeries,
  CHART_COLORS,
  formatCurrency,
  formatDate,
  percentChange,
  formatTime,
  toLocalIso,
} from "@/components/dashboard/chart-tools"
import {
  SkeletonChartGrid,
  SkeletonKpiGrid,
  SkeletonTable,
} from "@/components/ui/skeleton-patterns"
import * as appointmentsService from "@/services/appointments.service"
import * as barbersService from "@/services/barbers.service"
import * as branchesService from "@/services/branches.service"
import * as servicesService from "@/services/service-offering.service"
import type { Appointment } from "@/types/appointment"
import type { Branch } from "@/types/branch"

const PAGE_SIZE = 8

const statusBadge: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "outline" }> = {
  scheduled: { label: "Programada", variant: "default" },
  completed: { label: "Completada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  "no-show": { label: "No asistió", variant: "warning" },
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [barberCount, setBarberCount] = useState(0)
  const [services, setServices] = useState<Array<{ id: string; name: string }>>([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      appointmentsService.getAll(),
      barbersService.getAll(),
      branchesService.getAll(),
      servicesService.getAll(),
    ])
      .then(([apps, barbers, brs, svcs]) => {
        if (cancelled) return
        setAppointments(apps)
        setBarberCount(barbers.length)
        setBranches(brs)
        setServices(svcs.map((s) => ({ id: s.id, name: s.name })))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const today = toLocalIso(new Date())
  const todayCount = appointments.filter((a) => toLocalIso(new Date(a.startTime)) === today).length

  const completed = useMemo(() => appointments.filter((a) => a.status === "completed"), [appointments])
  const revenue = useMemo(
    () => completed.reduce((sum, a) => sum + (a.service?.price ?? 0), 0),
    [completed],
  )

  const dailySeries = useMemo(() => buildDailySeries(appointments, 30), [appointments])
  const revenueSeries = useMemo(() => buildDailySeries(completed, 30), [completed])
  const conversionSeries = useMemo(
    () => buildDailySeries(appointments, 30).map((d) => {
      const completedOnDay = completed.filter(
        (a) => toLocalIso(new Date(a.startTime)) === d.key,
      ).length
      return { ...d, rate: d.count > 0 ? Math.round((completedOnDay / d.count) * 100) : 0 }
    }),
    [appointments, completed],
  )

  const barberSparkline = useMemo(() => {
    const byDay = buildDailySeries(appointments, 14)
    return byDay.map((d) => {
      const barbersThatDay = new Set(
        appointments
          .filter((a) => toLocalIso(new Date(a.startTime)) === d.key)
          .map((a) => a.barberId),
      ).size
      return barbersThatDay
    })
  }, [appointments])

  const serviceUsage = useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of appointments) {
      const id = a.serviceId
      counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    return Array.from(counts.entries())
      .map(([id, value]) => ({
        name: services.find((s) => s.id === id)?.name ?? "Servicio",
        value,
        color: "",
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [appointments, services])

  const donutData = useMemo(
    () => serviceUsage.map((s, i) => ({ ...s, color: CHART_COLORS[i % CHART_COLORS.length] })),
    [serviceUsage],
  )

  const kpiTrends = useMemo(() => {
    const trend30 = buildDailySeries(completed, 30)
    const last7 = trend30.slice(-7).reduce((sum, d) => sum + d.revenue, 0)
    const prev7 = trend30.slice(-14, -7).reduce((sum, d) => sum + d.revenue, 0)

    const counts = buildDailySeries(appointments, 30)
    const last7Count = counts.slice(-7).reduce((sum, d) => sum + d.count, 0)
    const prev7Count = counts.slice(-14, -7).reduce((sum, d) => sum + d.count, 0)

    const cov = conversionSeries.map((d) => d.rate)
    const last7Cov = cov.length > 7 ? cov.slice(-7).reduce((a, b) => a + b, 0) / 7 : 0
    const prev7Cov = cov.length > 14 ? cov.slice(-14, -7).reduce((a, b) => a + b, 0) / 7 : 0

    return {
      revenue: prev7 > 0 ? percentChange(last7, prev7) : undefined,
      appointments: prev7Count > 0 ? percentChange(last7Count, prev7Count) : undefined,
      conversion: prev7Cov > 0 ? percentChange(last7Cov, prev7Cov) : undefined,
    }
  }, [completed, appointments, conversionSeries])

  const branchActivity = useMemo(() => {
    return branches.map((b) => {
      const count = appointments.filter((a) => a.barber?.branchId === b.id).length
      return { name: b.name, address: b.address, count }
    })
  }, [branches, appointments])

  const recentTransactions = useMemo(
    () =>
      [...appointments]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [appointments],
  )

  const totalPages = Math.max(1, Math.ceil(recentTransactions.length / PAGE_SIZE))
  const visibleTransactions = recentTransactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonKpiGrid cols={4} />
        <SkeletonChartGrid charts={2} />
        <SkeletonChartGrid charts={2} />
        <SkeletonTable rows={6} cols={5} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Ingresos (completadas)"
          value={formatCurrency(revenue)}
          trend={kpiTrends.revenue}
          icon={<Coins className="size-4 text-primary" />}
          color={CHART_COLORS[0]}
          sparkline={revenueSeries.map((d) => d.revenue)}
        />
        <KpiCard
          label="Citas hoy"
          value={todayCount}
          trend={kpiTrends.appointments}
          icon={<CalendarCheck className="size-4 text-primary" />}
          color={CHART_COLORS[1]}
          sparkline={dailySeries.slice(-14).map((d) => d.count)}
        />
        <KpiCard
          label="Barbers activos"
          value={barberCount}
          trend={undefined}
          icon={<UserCog className="size-4 text-primary" />}
          color={CHART_COLORS[3]}
          sparkline={barberSparkline}
        />
        <KpiCard
          label="Conversión"
          value={`${Math.round((completed.length / Math.max(1, appointments.length)) * 100)}%`}
          trend={kpiTrends.conversion}
          icon={<Banknote className="size-4 text-primary" />}
          color={CHART_COLORS[2]}
          sparkline={conversionSeries.map((d) => d.rate)}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardAreaChart
          title="Citas por día"
          description="Últimos 30 días"
          series={dailySeries}
          dataKey="count"
          color={CHART_COLORS[0]}
          className="lg:col-span-2"
        />
        <DonutChart
          title="Servicios más usados"
          description="Por número de citas"
          data={donutData}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardAreaChart
          title="Ingresos por día"
          description="Solo citas completadas"
          series={revenueSeries}
          dataKey="revenue"
          color={CHART_COLORS[1]}
          className="lg:col-span-2"
        />
        <LocationsOverview
          title="Sucursales"
          description="Actividad por sucursal"
          locations={branchActivity}
        />
      </div>

      {/* Recent transactions */}
      <div>
        <TransactionsTable
          title="Citas recientes"
          description={`${recentTransactions.length} citas registradas`}
          rows={visibleTransactions}
          columns={[
            {
              key: "customer",
              header: "Cliente",
              render: (a) => (
                <span className="font-medium text-foreground">{a.customer?.name ?? "—"}</span>
              ),
            },
            {
              key: "service",
              header: "Servicio",
              render: (a) => <span className="text-muted-foreground">{a.service?.name ?? "—"}</span>,
            },
            {
              key: "time",
              header: "Hora",
              render: (a) => (
                <span className="font-mono text-sm">{formatDate(a.startTime, { day: "numeric", month: "short" })} · {formatTime(a.startTime)}</span>
              ),
            },
            {
              key: "status",
              header: "Estado",
              render: (a) => {
                const s = statusBadge[a.status] ?? { label: a.status, variant: "outline" as const }
                return <Badge variant={s.variant}>{s.label}</Badge>
              },
            },
            {
              key: "amount",
              header: "Monto",
              align: "right",
              render: (a) => (
                <span className={a.status === "completed" ? "font-medium text-foreground" : "text-muted-foreground"}>
                  {formatCurrency(a.service?.price ?? 0)}
                </span>
              ),
            },
          ]}
        />
        {totalPages > 1 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
