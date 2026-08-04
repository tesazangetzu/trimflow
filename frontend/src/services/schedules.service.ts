import api from "@/lib/axios"
import type { Schedule, CreateScheduleDto, UpdateScheduleDto } from "@/types/schedule"

export async function getAll(barberId?: string): Promise<Schedule[]> {
  const params = barberId ? { barberId } : {}
  const { data } = await api.get("/schedules", { params })
  return data
}

export async function getById(id: string): Promise<Schedule> {
  const { data } = await api.get(`/schedules/${id}`)
  return data
}

export async function create(dto: CreateScheduleDto): Promise<Schedule> {
  const { data } = await api.post("/schedules", dto)
  return data
}

export async function update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
  const { data } = await api.patch(`/schedules/${id}`, dto)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/schedules/${id}`)
}
