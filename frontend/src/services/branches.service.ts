import api from "@/lib/axios"
import type { Branch, CreateBranchDto, UpdateBranchDto } from "@/types/branch"

export async function getAll(tenantId?: string): Promise<Branch[]> {
  const params = tenantId ? { tenantId } : {}
  const { data } = await api.get("/branches", { params })
  return data
}

export async function getById(id: string): Promise<Branch> {
  const { data } = await api.get(`/branches/${id}`)
  return data
}

export async function create(dto: CreateBranchDto): Promise<Branch> {
  const { data } = await api.post("/branches", dto)
  return data
}

export async function update(id: string, dto: UpdateBranchDto): Promise<Branch> {
  const { data } = await api.patch(`/branches/${id}`, dto)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/branches/${id}`)
}
