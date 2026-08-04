import api from "@/lib/axios"
import type { Service, CreateServiceDto, UpdateServiceDto } from "@/types/service"

export async function getAll(branchId?: string): Promise<Service[]> {
  const params = branchId ? { branchId } : {}
  const { data } = await api.get("/services", { params })
  return data
}

export async function getById(id: string): Promise<Service> {
  const { data } = await api.get(`/services/${id}`)
  return data
}

export async function create(dto: CreateServiceDto): Promise<Service> {
  const { data } = await api.post("/services", dto)
  return data
}

export async function update(id: string, dto: UpdateServiceDto): Promise<Service> {
  const { data } = await api.patch(`/services/${id}`, dto)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/services/${id}`)
}
