export type TenantStatus = "active" | "suspended" | "trial"

export interface Tenant {
  id: string
  name: string
  slug: string
  email?: string
  status: TenantStatus
  settings?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateTenantDto {
  name: string
  slug: string
  email?: string
  settings?: Record<string, unknown>
}

export interface UpdateTenantDto {
  name?: string
  slug?: string
  email?: string
  settings?: Record<string, unknown>
}
