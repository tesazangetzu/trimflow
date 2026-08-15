import api from "@/lib/axios"
import type { MyTenant, Tenant, CreateTenantDto, UpdateTenantDto } from "@/types/tenant"

export async function getMyTenant(): Promise<MyTenant> {
  const { data } = await api.get("/tenants/me")
  return data
}

export async function getAll(): Promise<Tenant[]> {
  const { data } = await api.get("/tenants")
  return data
}

export async function getById(id: string): Promise<Tenant> {
  const { data } = await api.get(`/tenants/${id}`)
  return data
}

export async function create(dto: CreateTenantDto): Promise<Tenant> {
  const { data } = await api.post("/tenants", dto)
  return data
}

export async function update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
  const { data } = await api.patch(`/tenants/${id}`, dto)
  return data
}

export async function activate(id: string): Promise<Tenant> {
  const { data } = await api.post(`/tenants/${id}/activate`)
  return data
}

export async function suspend(id: string): Promise<Tenant> {
  const { data } = await api.post(`/tenants/${id}/suspend`)
  return data
}
