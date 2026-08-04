import {
  appointmentStatusLabel,
  appointmentStatusVariant,
  APPOINTMENT_STATUS,
} from "@/lib/appointments-status"

describe("appointmentStatusLabel", () => {
  it("traduce scheduled a Programada", () => {
    expect(appointmentStatusLabel("scheduled")).toBe("Programada")
  })

  it("traduce completed a Completada", () => {
    expect(appointmentStatusLabel("completed")).toBe("Completada")
  })

  it("traduce cancelled a Cancelada", () => {
    expect(appointmentStatusLabel("cancelled")).toBe("Cancelada")
  })

  it("traduce no-show a No asistió", () => {
    expect(appointmentStatusLabel("no-show")).toBe("No asistió")
  })
})

describe("appointmentStatusVariant", () => {
  it("mapea los variantes conocidos", () => {
    expect(appointmentStatusVariant("scheduled")).toBe("default")
    expect(appointmentStatusVariant("completed")).toBe("success")
    expect(appointmentStatusVariant("cancelled")).toBe("destructive")
    expect(appointmentStatusVariant("no-show")).toBe("warning")
  })

  it("devuelve outline para un estado desconocido", () => {
    expect(appointmentStatusVariant("unknown" as never)).toBe("outline")
  })
})

describe("APPOINTMENT_STATUS", () => {
  it("expone labels y variants por estado", () => {
    expect(APPOINTMENT_STATUS.scheduled).toEqual({ label: "Programada", variant: "default" })
  })
})