import { act, render, screen, waitFor } from "@testing-library/react"
import { useTenantName } from "@/hooks/use-tenant-name"
import * as tenantsService from "@/services/tenants.service"

jest.mock("@/services/tenants.service", () => ({
  getMyTenant: jest.fn(),
}))

const mockedGetMyTenant = jest.mocked(tenantsService.getMyTenant)

function Probe({ tenantId }: { tenantId?: string }) {
  const { tenantName, loading, error } = useTenantName(tenantId)
  return (
    <div>
      <span data-testid="name">{tenantName ?? ""}</span>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="error">{error ? "error" : ""}</span>
    </div>
  )
}

describe("useTenantName", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("does not fetch when tenantId is missing", () => {
    render(<Probe />)
    expect(mockedGetMyTenant).not.toHaveBeenCalled()
    expect(screen.getByTestId("loading")).toHaveTextContent("false")
  })

  it("fetches the tenant name on mount", async () => {
    mockedGetMyTenant.mockResolvedValue({ id: "t1", name: "Barbería El Clásico" })

    render(<Probe tenantId="t1" />)

    await waitFor(() => {
      expect(screen.getByTestId("name")).toHaveTextContent("Barbería El Clásico")
    })
    expect(mockedGetMyTenant).toHaveBeenCalledTimes(1)
  })

  it("refetches when the tab becomes visible again", async () => {
    mockedGetMyTenant.mockResolvedValue({ id: "t1", name: "Barbería El Clásico" })

    render(<Probe tenantId="t1" />)
    await waitFor(() => expect(mockedGetMyTenant).toHaveBeenCalledTimes(1))

    act(() => document.dispatchEvent(new Event("visibilitychange")))

    await waitFor(() => expect(mockedGetMyTenant).toHaveBeenCalledTimes(2))
  })

  it("refetches on window focus", async () => {
    mockedGetMyTenant.mockResolvedValue({ id: "t1", name: "Barbería El Clásico" })

    render(<Probe tenantId="t1" />)
    await waitFor(() => expect(mockedGetMyTenant).toHaveBeenCalledTimes(1))

    act(() => window.dispatchEvent(new Event("focus")))

    await waitFor(() => expect(mockedGetMyTenant).toHaveBeenCalledTimes(2))
  })

  it("cleans up listeners on unmount", async () => {
    mockedGetMyTenant.mockResolvedValue({ id: "t1", name: "Barbería El Clásico" })

    const { unmount } = render(<Probe tenantId="t1" />)
    await waitFor(() => expect(mockedGetMyTenant).toHaveBeenCalledTimes(1))

    unmount()
    act(() => document.dispatchEvent(new Event("visibilitychange")))
    act(() => window.dispatchEvent(new Event("focus")))

    expect(mockedGetMyTenant).toHaveBeenCalledTimes(1)
  })
})