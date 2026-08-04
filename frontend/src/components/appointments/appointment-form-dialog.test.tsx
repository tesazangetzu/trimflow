import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AppointmentFormDialog } from "@/components/appointments/appointment-form-dialog"
import * as appointmentsService from "@/services/appointments.service"
import * as barbersService from "@/services/barbers.service"
import * as customersService from "@/services/customers.service"
import * as servicesService from "@/services/service-offering.service"
import type { Appointment } from "@/types/appointment"

jest.mock("@/services/appointments.service", () => ({
  create: jest.fn(),
  getAll: jest.fn(),
}))
jest.mock("@/services/barbers.service", () => ({ getAll: jest.fn() }))
jest.mock("@/services/customers.service", () => ({ getAll: jest.fn() }))
jest.mock("@/services/service-offering.service", () => ({
  getAll: jest.fn(),
  create: jest.fn(),
}))

const mockAdd = jest.fn()
jest.mock("@/components/ui/toast", () => ({
  useToastManager: () => ({ add: mockAdd }),
}))

const mockedCreate = jest.mocked(appointmentsService.create)
const mockedBarbers = jest.mocked(barbersService.getAll)
const mockedCustomers = jest.mocked(customersService.getAll)
const mockedServices = jest.mocked(servicesService.getAll)

const barber = { id: "b1", name: "Juan", email: "j@x.com", branchId: "br", createdAt: "", updatedAt: "" }
const customer = { id: "c1", name: "Ana", email: "a@x.com", branchId: "br", createdAt: "", updatedAt: "" }
const service = { id: "s1", name: "Corte", price: 25, durationMinutes: 30, branchId: "br", createdAt: "", updatedAt: "" }

const createdAppointment: Partial<Appointment> = {
  id: "apt-1",
  startTime: "2026-08-02T14:00:00.000Z",
  endTime: "2026-08-02T14:30:00.000Z",
  barberId: "b1",
  customerId: "c1",
  serviceId: "s1",
}

describe("AppointmentFormDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedBarbers.mockResolvedValue([barber])
    mockedCustomers.mockResolvedValue([customer])
    mockedServices.mockResolvedValue([service])
    mockedCreate.mockResolvedValue(createdAppointment as Appointment)
  })

  it("pobla los selects y crea una cita al enviar", async () => {
    const user = userEvent.setup()
    const onCreated = jest.fn()
    const onOpenChange = jest.fn()
    render(
      <AppointmentFormDialog open onOpenChange={onOpenChange} onCreated={onCreated} />
    )

    await waitFor(() => expect(mockedBarbers).toHaveBeenCalled())

    await user.type(screen.getByLabelText(/Inicio/i), "2026-08-02T14:00")
    await user.type(screen.getByLabelText(/Fin/i), "2026-08-02T14:30")

    await user.click(screen.getByLabelText(/Barber/i))
    await user.click(await screen.findByRole("option", { name: /Juan/i }))

    await user.click(screen.getByLabelText(/Cliente/i))
    await user.click(await screen.findByRole("option", { name: /Ana/i }))

    await user.click(screen.getByLabelText(/Servicio/i))
    await user.click(await screen.findByRole("option", { name: /Corte/i }))

    await user.click(screen.getByRole("button", { name: /Crear Cita/i }))

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          barberId: "b1",
          customerId: "c1",
          serviceId: "s1",
          notes: undefined,
        })
      )
    })
    expect(onCreated).toHaveBeenCalledWith(createdAppointment)
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Cita creada" })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("muestra toast de error cuando falla la creación", async () => {
    const user = userEvent.setup()
    mockedCreate.mockRejectedValue(new Error("conflicto de horario"))
    render(<AppointmentFormDialog open onOpenChange={() => {}} />)

    await user.type(screen.getByLabelText(/Inicio/i), "2026-08-02T14:00")
    await user.type(screen.getByLabelText(/Fin/i), "2026-08-02T14:30")

    await user.click(screen.getByLabelText(/Barber/i))
    await user.click(await screen.findByRole("option", { name: /Juan/i }))

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Crear Cita/i })).toBeEnabled()
    })
    await user.click(screen.getByRole("button", { name: /Crear Cita/i }))

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Error al crear" })
      )
    })
    expect(screen.getByText("conflicto de horario")).toBeInTheDocument()
  })
})