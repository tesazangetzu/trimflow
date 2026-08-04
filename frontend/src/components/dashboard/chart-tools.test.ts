import {
  formatCurrency,
  formatDate,
  formatTime,
  percentChange,
  toLocalIso,
  startOfDay,
  buildDailySeries,
  buildHourlySeries,
} from "@/components/dashboard/chart-tools"
import type { Appointment } from "@/types/appointment"

const makeAppointment = (overrides: Partial<Appointment>): Appointment => ({
  id: "a1",
  startTime: "2026-08-02T10:00:00.000Z",
  endTime: "2026-08-02T10:30:00.000Z",
  status: "scheduled",
  barberId: "b1",
  customerId: "c1",
  serviceId: "s1",
  createdAt: "2026-08-02T10:00:00.000Z",
  updatedAt: "2026-08-02T10:00:00.000Z",
  service: { id: "s1", name: "Corte", price: 25, durationMinutes: 30, branchId: "br1", createdAt: "", updatedAt: "" },
  ...overrides,
})

describe("formatCurrency", () => {
  it("formatea un valor entero con soles (PEN, es-PE)", () => {
    expect(formatCurrency(25)).toContain("S/")
  })

  it("formatea el cero", () => {
    expect(formatCurrency(0)).toContain("S/")
  })

  it("formatea un valor con decimales redondeando", () => {
    const out = formatCurrency(99.5)
    expect(out).toContain("S/")
    expect(out).not.toContain(",99")
    expect(out).not.toContain(".99")
  })
})

describe("formatTime", () => {
  it("formatea HH:mm sin segundos", () => {
    const date = new Date(2026, 7, 2, 14, 5, 45)
    expect(formatTime(date)).toBe("14:05")
  })
})

describe("formatDate", () => {
  it("formatea una fecha en es-PE", () => {
    const out = formatDate(new Date(2026, 7, 2))
    expect(out).toContain("2026")
  })
})

describe("percentChange", () => {
  it("calcula el cambio porcentual positivo", () => {
    expect(percentChange(150, 100)).toBe(50)
  })

  it("calcula el cambio porcentual negativo", () => {
    expect(percentChange(0, 100)).toBe(-100)
  })

  it("devuelve 0 cuando el valor previo es 0", () => {
    expect(percentChange(100, 0)).toBe(0)
  })
})

describe("toLocalIso", () => {
  it("devuelve YYYY-MM-DD", () => {
    expect(toLocalIso(new Date(2026, 7, 2, 15, 30))).toBe("2026-08-02")
  })
})

describe("startOfDay", () => {
  it("pone la hora a 00:00:00", () => {
    const d = startOfDay(new Date(2026, 7, 2, 15, 30, 45))
    expect(d.getHours()).toBe(0)
    expect(d.getMinutes()).toBe(0)
    expect(d.getSeconds()).toBe(0)
    expect(d.getMilliseconds()).toBe(0)
  })
})

describe("buildDailySeries", () => {
  it("cuenta citas y suma revenue por día", () => {
    const today = new Date()
    const appointment = makeAppointment({
      startTime: today.toISOString(),
      service: { id: "s1", name: "Corte", price: 25, durationMinutes: 30, branchId: "br1", createdAt: "", updatedAt: "" },
    })
    const series = buildDailySeries([appointment], 7)
    expect(series).toHaveLength(7)
    const todayPoint = series.find((p) => p.key === toLocalIso(today))
    expect(todayPoint?.count).toBe(1)
    expect(todayPoint?.revenue).toBe(25)
  })
})

describe("buildHourlySeries", () => {
  it("agrupa por hora y suma revenue", () => {
    const date = new Date(2026, 7, 2, 10, 0, 0)
    const appointment = makeAppointment({ startTime: date.toISOString() })
    const localHour = new Date(appointment.startTime).getHours()
    const series = buildHourlySeries([appointment])
    expect(series).toHaveLength(24)
    expect(series[localHour].count).toBe(1)
    expect(series.reduce((sum, p) => sum + p.revenue, 0)).toBe(25)
  })
})