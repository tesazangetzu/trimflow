import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import SchedulesPage from "@/app/(dashboard)/admin/schedules/page"
import * as barbersService from "@/services/barbers.service"
import * as schedulesService from "@/services/schedules.service"
import type { Barber } from "@/types/barber"
import type { Schedule } from "@/types/schedule"

jest.mock("@/services/barbers.service", () => ({
  getAll: jest.fn(),
}))

jest.mock("@/services/schedules.service", () => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
}))

const mockedBarbersGetAll = jest.mocked(barbersService.getAll)
const mockedSchedulesGetAll = jest.mocked(schedulesService.getAll)
const mockedCreate = jest.mocked(schedulesService.create)
const mockedUpdate = jest.mocked(schedulesService.update)

const barber: Barber = {
  id: "b1",
  name: "Juan Pérez",
  email: "juan@example.com",
  branchId: "br1",
  createdAt: "",
  updatedAt: "",
}

const schedule: Schedule = {
  id: "sch-1",
  barberId: "b1",
  dayOfWeek: 1,
  startTime: "09:00:00",
  endTime: "18:00:00",
  breakStartTime: null,
  breakEndTime: null,
  isActive: true,
  createdAt: "",
  updatedAt: "",
}

const renderWithData = async () => {
  const user = userEvent
  mockedBarbersGetAll.mockResolvedValue([barber])
  mockedSchedulesGetAll.mockResolvedValue([schedule])
  render(<SchedulesPage />)
  await screen.findByText("Juan Pérez")
  return user
}

describe("SchedulesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("muestra el skeleton mientras carga", () => {
    mockedBarbersGetAll.mockReturnValue(new Promise(() => {}))
    const { container } = render(<SchedulesPage />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it("renderiza los barbers con badges de horarios", async () => {
    await renderWithData()
    expect(screen.getByText("Juan Pérez")).toBeInTheDocument()
    expect(screen.getByText(/1 día/)).toBeInTheDocument()
  })

  it("crea un horario multi-día llamando a create por cada día", async () => {
    mockedCreate.mockResolvedValue(schedule)
    const user = await renderWithData()

    await user.click(screen.getByText("Juan Pérez"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    const lunesCheckbox = screen.getByRole("checkbox", { name: "Lun" })
    expect(lunesCheckbox).toBeChecked()

    const martesCheckbox = screen.getByRole("checkbox", { name: "Mar" })
    await user.click(martesCheckbox)
    expect(martesCheckbox).toBeChecked()

    await user.click(screen.getByRole("button", { name: "Agregar" }))

    expect(mockedCreate).toHaveBeenCalledTimes(2)
    expect(mockedCreate).toHaveBeenNthCalledWith(1, expect.objectContaining({ dayOfWeek: 1 }))
    expect(mockedCreate).toHaveBeenNthCalledWith(2, expect.objectContaining({ dayOfWeek: 2 }))
  })

  it("bloquea el día en edición y llama a update una sola vez", async () => {
    mockedUpdate.mockResolvedValue(schedule)
    const user = await renderWithData()

    await user.click(screen.getByText("Juan Pérez"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Editar" }))

    expect(screen.queryByRole("checkbox", { name: "Lun" })).not.toBeInTheDocument()
    const daySelect = screen.getByLabelText("Día")
    expect(daySelect).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Actualizar" }))

    expect(mockedUpdate).toHaveBeenCalledTimes(1)
    expect(mockedUpdate).toHaveBeenCalledWith("sch-1", expect.objectContaining({ startTime: "09:00" }))
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it("muestra error si no se selecciona ningún día al crear", async () => {
    const user = await renderWithData()

    await user.click(screen.getByText("Juan Pérez"))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    const lunesCheckbox = screen.getByRole("checkbox", { name: "Lun" })
    await user.click(lunesCheckbox)

    await user.click(screen.getByRole("button", { name: "Agregar" }))

    expect(await screen.findByText("Selecciona al menos un día")).toBeInTheDocument()
    expect(mockedCreate).not.toHaveBeenCalled()
  })
})