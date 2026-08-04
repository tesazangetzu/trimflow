import type { Appointment } from "@/types/appointment"

export interface DayPoint {
  key: string
  label: string
  count: number
  revenue: number
}

export interface HourPoint {
  hour: number
  label: string
  count: number
  revenue: number
}

export const CHART_COLORS = ["#4680ff", "#1abc9c", "#e58a00", "#7c4dff", "#3ebfea"]

export const DAY_LABELS = new Intl.DateTimeFormat("es-PE", {
  weekday: "short",
})

export const MONTH_LABELS = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
})

export function toLocalIso(date: Date): string {
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60_000)
  return local.toISOString().slice(0, 10)
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Agrupa citas en una serie diaria para los últimos `days` días (incluyendo hoy). */
export function buildDailySeries(appointments: Appointment[], days = 7): DayPoint[] {
  const today = startOfDay(new Date())
  const points: DayPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    const key = toLocalIso(date)
    const dayApps = appointments.filter((a) => toLocalIso(new Date(a.startTime)) === key)
    points.push({
      key,
      label: MONTH_LABELS.format(date),
      count: dayApps.length,
      revenue: dayApps.reduce((sum, a) => sum + (a.service?.price ?? 0), 0),
    })
  }
  return points
}

/** Agrupa citas en una serie por hora del día (0-23). */
export function buildHourlySeries(appointments: Appointment[]): HourPoint[] {
  const points: HourPoint[] = []
  for (let hour = 0; hour < 24; hour++) {
    const hourApps = appointments.filter((a) => new Date(a.startTime).getHours() === hour)
    points.push({
      hour,
      label: `${String(hour).padStart(2, "0")}:00`,
      count: hourApps.length,
      revenue: hourApps.reduce((sum, a) => sum + (a.service?.price ?? 0), 0),
    })
  }
  return points
}

/** Formatea un precio numérico en soles (PEN, es-PE). */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    maximumFractionDigits: 0,
  }).format(value)
}

/** Formatea fecha en es-PE. */
export function formatDate(input: string | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(input).toLocaleDateString("es-PE", options)
}

/** Formatea hora HH:mm. */
export function formatTime(input: string | Date): string {
  return new Date(input).toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

/** Calcula el cambio porcentual entre dos valores (0 si el previo es 0). */
export function percentChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}
