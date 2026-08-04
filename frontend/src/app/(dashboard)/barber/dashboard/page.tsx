"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, CalendarCheck, ChevronRight, Clock, ListChecks } from "lucide-react"
import { AppointmentDetailDialog } from "@/components/appointments/appointment-detail-dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DashboardAreaChart,
  DonutChart,
  KpiCard,
} from "@/components/dashboard"
import {
  buildHourlySeries,
  CHART_COLORS,
  formatTime,
  toLocalIso,
} from "@/components/dashboard/chart-tools"
import * as appointmentsService from "@/services/appointments.service"
import type { Appointment } from "@/types/appointment"

const statusMeta: Record<string, { label: string; variant: "default" | "success" | "destructive" | "warning" | "outline" }> = {
  scheduled: { label: "Programada", variant: "default" },
  completed: { label: "Completada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  "no-show": { label: "No Asistió", variant: "warning" },
}

const statusColors: Record<string, string> = {
  scheduled: CHART_COLORS[0],
  completed: CHART_COLORS[4],
  cancelled: "var(--destructive)",
  "no-show": CHART_COLORS[2],
}

export default function BarberDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const today = toLocalIso(new Date())

  useEffect(() => {
    let cancelled = false
    appointmentsService.getAll(undefined, today).then((data) => {
      if (!cancelled) setAppointments(data)
    })
    return () => {
      cancelled = true
    }
  }, [today])

  const counts = useMemo(
    () => ({
      total: appointments.length,
      scheduled: appointments.filter((a) => a.status === "scheduled").length,
      completed: appointments.filter((a) => a.status === "completed").length,
      cancelled: appointments.filter((a) => a.status === "cancelled").length,
      noShow: appointments.filter((a) => a.status === "no-show").length,
    }),
    [appointments],
  )

  const hourly = useMemo(() => buildHourlySeries(appointments), [appointments])

  const statusDonut = [
    { name: "Programadas", value: counts.scheduled, color: statusColors.scheduled },
    { name: "Completadas", value: counts.completed, color: statusColors.completed },
    { name: "Canceladas", value: counts.cancelled, color: statusColors.cancelled },
    { name: "No asistió", value: counts.noShow, color: statusColors["no-show"] },
  ].filter((d) => d.value > 0)

  const sorted = useMemo(
    () =>
      [...appointments].sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
      ),
    [appointments],
  )

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Total hoy"
          value={counts.total}
          icon={<CalendarCheck className="size-4 text-primary" />}
          color={CHART_COLORS[0]}
          sparkline={hourly.map((h) => h.count)}
        />
        <KpiCard
          label="Pendientes"
          value={counts.scheduled}
          icon={<Clock className="size-4 text-primary" />}
          color={CHART_COLORS[1]}
          sparkline={hourly.filter((h) => h.count > 0).map((h) => h.count)}
        />
        <KpiCard
          label="Completadas"
          value={counts.completed}
          icon={<ListChecks className="size-4 text-primary" />}
          color={CHART_COLORS[4]}
          sparkline={hourly.map((h) => h.count)}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardAreaChart
          title="Citas por hora"
          description="Distribución a lo largo del día"
          series={hourly.map((h) => ({
            key: String(h.hour),
            label: h.label,
            count: h.count,
            revenue: h.revenue,
          }))}
          dataKey="count"
          color={CHART_COLORS[0]}
          className="lg:col-span-2"
        />
        <DonutChart
          title="Estado de hoy"
          description="Distribución por estado"
          data={statusDonut.length > 0 ? statusDonut : [{ name: "Sin citas", value: 1, color: "var(--border)" }]}
        />
      </div>

      {/* Today's table */}
      <Card className="overflow-hidden rounded-xl border bg-card">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Citas de Hoy</CardTitle>
              <CardDescription>
                {appointments.length > 0
                  ? `Tienes ${appointments.length} cita${appointments.length !== 1 ? "s" : ""} programada${appointments.length !== 1 ? "s" : ""}`
                  : "No hay citas programadas para hoy"}
              </CardDescription>
            </div>
            {appointments.length > 0 && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {counts.scheduled} pendientes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {appointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <Calendar className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">No hay citas para hoy</p>
              <p className="mt-1 text-xs text-muted-foreground">Disfruta tu día libre</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Hora</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((appt) => {
                  const status = statusMeta[appt.status] ?? {
                    label: appt.status,
                    variant: "outline" as const,
                  }
                  return (
                    <TableRow key={appt.id} className="transition-colors hover:bg-muted/20">
                      <TableCell className="font-mono text-sm font-medium">
                        {formatTime(appt.startTime)}
                      </TableCell>
                      <TableCell className="font-medium">{appt.customer?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {appt.service?.name ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => setSelectedId(appt.id)}
                          className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ChevronRight className="size-4" />
                          <span className="sr-only">Ver detalle</span>
                        </button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AppointmentDetailDialog
        appointmentId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null)
        }}
        onStatusChange={(updated) =>
          setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
        }
      />
    </div>
  )
}
