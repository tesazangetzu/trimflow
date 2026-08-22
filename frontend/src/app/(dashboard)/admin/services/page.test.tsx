import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ServicesPage from "@/app/(dashboard)/admin/services/page"
import * as servicesService from "@/services/service-offering.service"
import * as branchesService from "@/services/branches.service"
import type { Branch } from "@/types/branch"
import type { Service } from "@/types/service"

jest.mock("@/services/service-offering.service", () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}))

jest.mock("@/services/branches.service", () => ({
  getAll: jest.fn(),
}))

const mockAdd = jest.fn()
jest.mock("@/components/ui/toast", () => ({
  useToastManager: () => ({ add: mockAdd }),
}))

jest.mock("@/components/services/service-form-dialog", () => ({
  ServiceFormDialog: jest.fn(
    ({ open, defaultBranchId }: { open: boolean; defaultBranchId?: string }) =>
      open ? (
        <div
          data-testid="service-form-dialog"
          data-default-branch-id={defaultBranchId ?? ""}
        />
      ) : null
  ),
}))

const mockedGetAll = jest.mocked(servicesService.getAll)
const mockedBranchesGetAll = jest.mocked(branchesService.getAll)

const branches: Branch[] = [
  { id: "br1", name: "Centro", tenantId: "t1", createdAt: "", updatedAt: "" },
  { id: "br2", name: "Norte", tenantId: "t1", createdAt: "", updatedAt: "" },
]

const services: Service[] = [
  {
    id: "s1",
    name: "Corte clásico",
    description: "Corte con tijera",
    price: 25,
    durationMinutes: 30,
    branchId: "br1",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "s2",
    name: "Afeitado",
    price: 15,
    durationMinutes: 20,
    branchId: "br1",
    createdAt: "",
    updatedAt: "",
  },
]

describe("ServicesPage", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedBranchesGetAll.mockResolvedValue(branches)
  })

  it("muestra el skeleton mientras carga", () => {
    mockedGetAll.mockReturnValue(new Promise(() => {}))
    const { container } = render(<ServicesPage />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
  })

  it("renderiza el selector en Todas las sucursales y llama getAll() sin args", async () => {
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)

    await screen.findByText("Corte clásico")
    expect(mockedBranchesGetAll).toHaveBeenCalled()
    expect(mockedGetAll).toHaveBeenCalledWith(undefined)
    expect(
      screen.getByRole("combobox", { name: /Filtrar por sucursal/i })
    ).toHaveTextContent("Todas las sucursales")
  })

  it("seleccionar una sucursal dispara getAll('br1')", async () => {
    const user = userEvent.setup()
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")

    await user.click(screen.getByRole("combobox", { name: /Filtrar por sucursal/i }))
    await user.click(await screen.findByRole("option", { name: "Centro" }))

    await screen.findByText("Corte clásico")
    expect(mockedGetAll).toHaveBeenLastCalledWith("br1")
  })

  it("volver a Todas las sucursales dispara getAll() sin args", async () => {
    const user = userEvent.setup()
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")

    await user.click(screen.getByRole("combobox", { name: /Filtrar por sucursal/i }))
    await user.click(await screen.findByRole("option", { name: "Centro" }))
    await screen.findByText("Corte clásico")

    await user.click(screen.getByRole("combobox", { name: /Filtrar por sucursal/i }))
    await user.click(
      await screen.findByRole("option", { name: "Todas las sucursales" })
    )
    await screen.findByText("Corte clásico")

    // undefined → request sin query param branchId
    expect(mockedGetAll).toHaveBeenLastCalledWith(undefined)
  })

  it("renderiza la tabla con servicios y precios formateados", async () => {
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)

    expect(await screen.findByText("Corte clásico")).toBeInTheDocument()
    expect(screen.getByText("Afeitado")).toBeInTheDocument()
    expect(screen.getByText(/30 min/)).toBeInTheDocument()
    expect(screen.getAllByText(/S\//).length).toBeGreaterThan(0)
    expect(screen.getAllByRole("button", { name: "Editar servicio" }).length).toBe(2)
  })

  it("abre el diálogo nuevo servicio al hacer clic", async () => {
    const user = userEvent
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")
    expect(screen.queryByTestId("service-form-dialog")).not.toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Nuevo Servicio/i }))
    expect(screen.getByTestId("service-form-dialog")).toBeInTheDocument()
  })

  it("con sucursal seleccionada pasa defaultBranchId al diálogo nuevo servicio", async () => {
    const user = userEvent.setup()
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")

    await user.click(screen.getByRole("combobox", { name: /Filtrar por sucursal/i }))
    await user.click(await screen.findByRole("option", { name: "Centro" }))
    await screen.findByText("Corte clásico")

    await user.click(screen.getByRole("button", { name: /Nuevo Servicio/i }))

    const dialog = screen.getByTestId("service-form-dialog")
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute("data-default-branch-id", "br1")
  })

  it("sin sucursal seleccionada no pasa defaultBranchId al diálogo", async () => {
    const user = userEvent
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")
    await user.click(screen.getByRole("button", { name: /Nuevo Servicio/i }))
    expect(screen.getByTestId("service-form-dialog")).toHaveAttribute(
      "data-default-branch-id",
      ""
    )
  })

  it("abre el diálogo de edición al pulsar editar", async () => {
    const user = userEvent
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")
    await user.click(screen.getAllByRole("button", { name: "Editar servicio" })[0])
    expect(screen.getByTestId("service-form-dialog")).toBeInTheDocument()
  })
})
