import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { BranchFilterSelect } from "@/components/branches/branch-filter-select"
import type { Branch } from "@/types/branch"

const branches: Branch[] = [
  {
    id: "br1",
    name: "Centro",
    tenantId: "t1",
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "br2",
    name: "Norte",
    tenantId: "t1",
    createdAt: "",
    updatedAt: "",
  },
]

describe("BranchFilterSelect", () => {
  it("renderiza el trigger con las sucursales y la opción Todas", async () => {
    const user = userEvent.setup()
    render(<BranchFilterSelect branches={branches} value={null} onChange={() => {}} />)

    const trigger = screen.getByRole("combobox", { name: /Filtrar por sucursal/i })
    expect(trigger).toHaveTextContent("Todas las sucursales")

    await user.click(trigger)
    expect(await screen.findByRole("option", { name: "Todas las sucursales" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Centro" })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: "Norte" })).toBeInTheDocument()
  })

  it("emite null al elegir Todas y el id al elegir una sucursal", async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    const { rerender } = render(
      <BranchFilterSelect branches={branches} value={null} onChange={onChange} />
    )

    await user.click(screen.getByRole("combobox", { name: /Filtrar por sucursal/i }))
    await user.click(await screen.findByRole("option", { name: "Centro" }))
    expect(onChange).toHaveBeenCalledWith("br1")

    rerender(
      <BranchFilterSelect branches={branches} value="br1" onChange={onChange} />
    )
    await user.click(screen.getByRole("combobox", { name: /Filtrar por sucursal/i }))
    await user.click(await screen.findByRole("option", { name: "Todas las sucursales" }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
