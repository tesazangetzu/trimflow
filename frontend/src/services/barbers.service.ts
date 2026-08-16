import api from "@/lib/axios"
import type { Barber, CreateBarberDto, UpdateBarberDto } from "@/types/barber"

export async function getAll(branchId?: string, schedule?: boolean): Promise<Barber[]> {
  const params = { ...(branchId ? { branchId } : {}), ...(schedule ? { schedule: "true" } : {}) }
  const { data } = await api.get("/barbers", { params })
  return data
}

export async function getById(id: string): Promise<Barber> {
  const { data } = await api.get(`/barbers/${id}`)
  return data
}

export async function create(dto: CreateBarberDto): Promise<Barber> {
  const { data } = await api.post("/barbers", dto)
  return data
}

export async function update(id: string, dto: UpdateBarberDto): Promise<Barber> {
  const { data } = await api.patch(`/barbers/${id}`, dto)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/barbers/${id}`)
}
