import api from "@/lib/axios"
import type { AvailabilityBlock, CreateBlockDto, UpdateBlockDto } from "@/types/schedule"

export async function getAll(barberId?: string): Promise<AvailabilityBlock[]> {
  const params = barberId ? { barberId } : {}
  const { data } = await api.get("/schedules/blocks", { params })
  return data
}

export async function getById(id: string): Promise<AvailabilityBlock> {
  const { data } = await api.get(`/schedules/blocks/${id}`)
  return data
}

export async function create(dto: CreateBlockDto): Promise<AvailabilityBlock> {
  const { data } = await api.post("/schedules/blocks", dto)
  return data
}

export async function update(id: string, dto: UpdateBlockDto): Promise<AvailabilityBlock> {
  const { data } = await api.patch(`/schedules/blocks/${id}`, dto)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/schedules/blocks/${id}`)
}
