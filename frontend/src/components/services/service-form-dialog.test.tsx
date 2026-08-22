import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ServiceFormDialog } from "@/components/services/service-form-dialog"
import * as servicesService from "@/services/service-offering.service"
import * as branchesService from "@/services/branches.service"
import type { Branch } from "@/types/branch"
import type { Service } from "@/types/service"

const createdService: Partial<Service> = {
  id: "srv-1",
  name: "Corte moderno",
  price: 30,
  durationMinutes: 45,
}

jest.mock("@/services/service-offering.service", () => ({
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

const mockedCreate = jest.mocked(servicesService.create)
const mockedBranchesGetAll = jest.mocked(branchesService.getAll)

const branches: Branch[] = [
  { id: "br1", name: "Centro", tenantId: "t1", createdAt: "", updatedAt: "" },
  { id: "br2", name: "Norte", tenantId: "t1", createdAt: "", updatedAt: "" },
]

describe("ServiceFormDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedCreate.mockResolvedValue(createdService as Service)
    mockedBranchesGetAll.mockResolvedValue(branches)
  })

  it("no renderiza contenido cuando open es false", () => {
    render(
      <ServiceFormDialog
        mode="create"
        open={false}
        onOpenChange={() => {}}
      />
    )
    expect(screen.queryByText("Crear servicio")).not.toBeInTheDocument()
  })

  it("crea un servicio usando defaultBranchId como sucursal pre-seleccionada", async () => {
    const user = userEvent.setup()
    const onCreated = jest.fn()
    const onOpenChange = jest.fn()
    render(
      <ServiceFormDialog
        mode="create"
        open
        onOpenChange={onOpenChange}
        defaultBranchId="br1"
        onCreated={onCreated}
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Sucursal/i)).toHaveTextContent("Centro")
    })

    await user.type(screen.getByLabelText(/Nombre/i), "Corte moderno")
    await user.type(screen.getByLabelText(/Precio/i), "30")
    await user.type(screen.getByLabelText(/Duración/i), "45")

    await user.click(screen.getByRole("button", { name: /Crear servicio/i }))

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith({
        name: "Corte moderno",
        price: 30,
        durationMinutes: 45,
        branchId: "br1",
        description: undefined,
      })
    })
    expect(onCreated).toHaveBeenCalledWith(createdService)
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Servicio creado" })
    )
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it("muestra error de validación y NO llama a create si no hay sucursal", async () => {
    const user = userEvent.setup()
    render(<ServiceFormDialog mode="create" open onOpenChange={() => {}} />)

    await user.type(screen.getByLabelText(/Nombre/i), "Corte moderno")
    await user.type(screen.getByLabelText(/Precio/i), "30")
    await user.type(screen.getByLabelText(/Duración/i), "45")

    await user.click(screen.getByRole("button", { name: /Crear servicio/i }))

    expect(await screen.findByText("Seleccioná una sucursal")).toBeInTheDocument()
    expect(mockedCreate).not.toHaveBeenCalled()
  })

  it("en create permite cambiar la sucursal dentro del form", async () => {
    const user = userEvent.setup()
    render(
      <ServiceFormDialog
        mode="create"
        open
        onOpenChange={() => {}}
        defaultBranchId="br1"
      />
    )

    await waitFor(() => {
      expect(screen.getByLabelText(/Sucursal/i)).toHaveTextContent("Centro")
    })

    await user.type(screen.getByLabelText(/Nombre/i), "Corte norte")
    await user.type(screen.getByLabelText(/Precio/i), "20")
    await user.type(screen.getByLabelText(/Duración/i), "30")

    await user.click(screen.getByLabelText(/Sucursal/i))
    await user.click(await screen.findByRole("option", { name: "Norte" }))

    await user.click(screen.getByRole("button", { name: /Crear servicio/i }))

    await waitFor(() => {
      expect(mockedCreate).toHaveBeenCalledWith(
        expect.objectContaining({ branchId: "br2" })
      )
    })
  })

  it("en edit no aparece el select de sucursal y update no recibe branchId", async () => {
    const user = userEvent.setup()
    const onSaved = jest.fn()
    const editService: Service = {
      id: "srv-2",
      name: "Barba",
      price: 15,
      durationMinutes: 20,
      branchId: "br1",
      createdAt: "",
      updatedAt: "",
    }
    const mockedUpdate = jest.mocked(servicesService.update).mockResolvedValue(editService)
    render(
      <ServiceFormDialog
        mode="edit"
        open
        onOpenChange={() => {}}
        entity={editService}
        defaultBranchId="br2"
        onSaved={onSaved}
      />
    )

    expect(screen.queryByLabelText(/Sucursal/i)).not.toBeInTheDocument()

    expect(screen.getByLabelText(/Nombre/i)).toHaveValue("Barba")
    await user.clear(screen.getByLabelText(/Precio/i))
    await user.type(screen.getByLabelText(/Precio/i), "20")
    await user.type(screen.getByLabelText(/Descripción/i), "Con navaja")
    await user.click(screen.getByRole("button", { name: /Guardar cambios/i }))

    await waitFor(() => {
      expect(mockedUpdate).toHaveBeenCalledTimes(1)
    })
    const dto = mockedUpdate.mock.calls[0][1]
    expect(dto).toEqual(
      expect.objectContaining({ price: 20, description: "Con navaja" })
    )
    expect(dto).not.toHaveProperty("branchId")
    expect(onSaved).toHaveBeenCalledWith(editService)
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success", title: "Cambios guardados" })
    )
  })

  it("muestra toast de error cuando la creación falla", async () => {
    const user = userEvent.setup()
    mockedCreate.mockRejectedValue(new Error("error de red"))
    render(
      <ServiceFormDialog
        mode="create"
        open
        onOpenChange={() => {}}
        defaultBranchId="br1"
      />
    )

    await user.type(screen.getByLabelText(/Nombre/i), "Corte")
    await user.type(screen.getByLabelText(/Precio/i), "25")
    await user.type(screen.getByLabelText(/Duración/i), "30")
    await user.click(screen.getByRole("button", { name: /Crear servicio/i }))

    await waitFor(() => {
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error", title: "Error al crear" })
      )
    })
    expect(screen.getByText("error de red")).toBeInTheDocument()
  })
})
