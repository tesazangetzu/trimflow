import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ServicesPage from "@/app/(dashboard)/admin/services/page"
import * as servicesService from "@/services/service-offering.service"
import type { Service } from "@/types/service"

jest.mock("@/services/service-offering.service", () => ({
  getAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}))

jest.mock("@/components/services/service-form-dialog", () => ({
  ServiceFormDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="service-form-dialog" /> : null,
}))

const mockedGetAll = jest.mocked(servicesService.getAll)

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
  })

  it("muestra el skeleton mientras carga", () => {
    mockedGetAll.mockReturnValue(new Promise(() => {}))
    const { container } = render(<ServicesPage />)
    expect(container.querySelector('[data-slot="skeleton"]')).toBeInTheDocument()
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

  it("abre el diálogo de edición al pulsar editar", async () => {
    const user = userEvent
    mockedGetAll.mockResolvedValue(services)
    render(<ServicesPage />)
    await screen.findByText("Corte clásico")
    await user.click(screen.getAllByRole("button", { name: "Editar servicio" })[0])
    expect(screen.getByTestId("service-form-dialog")).toBeInTheDocument()
  })
})