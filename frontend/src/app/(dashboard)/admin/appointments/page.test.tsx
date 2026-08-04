import { render, screen } from "@testing-library/react"
import AppointmentsPage from "@/app/(dashboard)/admin/appointments/page"
import * as appointmentsService from "@/services/appointments.service"
import { formatTime } from "@/components/dashboard/chart-tools"
import type { Appointment } from "@/types/appointment"

jest.mock("@/services/appointments.service", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  cancel: jest.fn(),
  complete: jest.fn(),
}))

jest.mock("@/components/appointments/appointment-form-dialog", () => ({
  AppointmentFormDialog: () => <div data-testid="appointment-form-dialog" />,
}))
jest.mock("@/components/appointments/appointment-detail-dialog", () => ({
  AppointmentDetailDialog: () => <div data-testid="appointment-detail-dialog" />,
}))

const mockedGetAll = jest.mocked(appointmentsService.getAll)

const appointment: Appointment = {
  id: "apt-1",
  startTime: "2026-08-02T14:00:00.000Z",
  endTime: "2026-08-02T14:30:00.000Z",
  status: "scheduled",
  barberId: "b1",
  customerId: "c1",
  serviceId: "s1",
  barber: { id: "b1", name: "Juan", email: "j@x.com", branchId: "br", createdAt: "", updatedAt: "" },
  customer: { id: "c1", name: "Ana", email: "a@x.com", branchId: "br", createdAt: "", updatedAt: "" },
  service: { id: "s1", name: "Corte", price: 25, durationMinutes: 30, branchId: "br", createdAt: "", updatedAt: "" },
  createdAt: "2026-08-02T14:00:00.000Z",
  updatedAt: "2026-08-02T14:00:00.000Z",
}

describe("AppointmentsPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("muestra el skeleton mientras carga", () => {
    mockedGetAll.mockReturnValue(new Promise(() => {}))
    const { container } = render(<AppointmentsPage />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it("renderiza la tabla con estado traducido y fechas formateadas", async () => {
    mockedGetAll.mockResolvedValue([appointment])
    const { container } = render(<AppointmentsPage />)

    expect(await screen.findByText("Juan")).toBeInTheDocument()
    expect(screen.getByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("Corte")).toBeInTheDocument()
    expect(screen.getByText("Programada")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Ver cita" })).toBeInTheDocument()
    expect(container.textContent).toContain(formatTime(new Date(appointment.startTime)))
  })
})