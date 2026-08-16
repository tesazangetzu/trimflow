import { render, screen, waitFor } from "@testing-library/react"
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
const mockedRemove = jest.mocked(schedulesService.remove)

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
  mockedBarbersGetAll.mockResolvedValue([{ ...barber, schedules: [schedule] }])
  mockedSchedulesGetAll.mockResolvedValue([schedule])
  render(<SchedulesPage />)
  await screen.findByText("Juan Pérez")
  return user
}

const renderWithManyBarbers = async (count: number) => {
  const user = userEvent
  const manyBarbers: Barber[] = Array.from({ length: count }, (_, i) => ({
    id: `b${i}`,
    name: `Barber ${i + 1}`,
    email: `barber${i + 1}@example.com`,
    branchId: "br1",
    createdAt: "",
    updatedAt: "",
    schedules: [],
  }))
  mockedBarbersGetAll.mockResolvedValue(manyBarbers)
  mockedSchedulesGetAll.mockResolvedValue([])
  render(<SchedulesPage />)
  await screen.findByText("Barber 1")
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

    await user.click(screen.getByRole("button", { name: "Editar horarios de Juan Pérez" }))
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

  it("abre el modal en modo edición al hacer click en el tag del horario", async () => {
    mockedUpdate.mockResolvedValue(schedule)
    const user = await renderWithData()

    await user.click(screen.getByRole("button", { name: "Lun 09:00-18:00" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    expect(screen.queryByRole("checkbox", { name: "Lun" })).not.toBeInTheDocument()
    const daySelect = screen.getByLabelText("Día")
    expect(daySelect).toBeDisabled()
    expect(daySelect).toHaveValue("1")
  })

  it("bloquea el día en edición y llama a update una sola vez", async () => {
    mockedUpdate.mockResolvedValue(schedule)
    const user = await renderWithData()

    await user.click(screen.getByRole("button", { name: "Lun 09:00-18:00" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    const daySelect = screen.getByLabelText("Día")
    expect(daySelect).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "Actualizar" }))

    expect(mockedUpdate).toHaveBeenCalledTimes(1)
    expect(mockedUpdate).toHaveBeenCalledWith("sch-1", expect.objectContaining({ startTime: "09:00" }))
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it("muestra error si no se selecciona ningún día al crear", async () => {
    const user = await renderWithData()

    await user.click(screen.getByRole("button", { name: "Editar horarios de Juan Pérez" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    const lunesCheckbox = screen.getByRole("checkbox", { name: "Lun" })
    await user.click(lunesCheckbox)

    await user.click(screen.getByRole("button", { name: "Agregar" }))

    expect(await screen.findByText("Selecciona al menos un día")).toBeInTheDocument()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it("filtra por nombre y email y resetea la página", async () => {
    const user = await renderWithManyBarbers(6)
    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Siguiente" }))
    expect(screen.getByText("Página 2 de 2")).toBeInTheDocument()

    const searchInput = screen.getByPlaceholderText("Buscar por nombre o email...")
    await user.type(searchInput, "barber")

    expect(screen.getByText("Página 1 de 2")).toBeInTheDocument()
    expect(screen.getByText("Barber 1")).toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, "barber 3")

    expect(screen.getByText("Barber 3")).toBeInTheDocument()
    expect(screen.queryByText("Barber 1")).not.toBeInTheDocument()
    expect(screen.queryByText("Barber 2")).not.toBeInTheDocument()
    expect(screen.queryByText(/Página \d+ de \d+/)).not.toBeInTheDocument()

    await user.clear(searchInput)
    await user.type(searchInput, "barber5@example.com")

    expect(screen.getByText("Barber 5")).toBeInTheDocument()
    expect(screen.queryByText("Barber 3")).not.toBeInTheDocument()
  })

  it("muestra el paginado solo con más de 5 barbers", async () => {
    const user = await renderWithManyBarbers(5)
    expect(screen.queryByText(/Página \d+ de \d+/)).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Editar horarios de Barber 1" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("elimina un horario desde el modal en modo edición", async () => {
    mockedRemove.mockResolvedValue(undefined)
    const user = await renderWithData()

    await user.click(screen.getByRole("button", { name: "Lun 09:00-18:00" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Eliminar" }))

    expect(mockedRemove).toHaveBeenCalledWith("sch-1")
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    })
  })

  it("no muestra la tabla de horarios configurados en el modal", async () => {
    const user = await renderWithData()

    await user.click(screen.getByRole("button", { name: "Editar horarios de Juan Pérez" }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()

    expect(screen.queryByText("Horarios configurados")).not.toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument()
  })

  it("hace una sola llamada con schedules al montar y no dispara el N+1", async () => {
    mockedBarbersGetAll.mockResolvedValue([{ ...barber, schedules: [schedule] }])
    render(<SchedulesPage />)
    await screen.findByText("Juan Pérez")

    expect(mockedBarbersGetAll).toHaveBeenCalledWith(undefined, true)
    expect(mockedSchedulesGetAll).not.toHaveBeenCalled()
  })
})