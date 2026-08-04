import api from "@/lib/axios"
import type { Appointment, CreateAppointmentDto, UpdateAppointmentDto } from "@/types/appointment"

export async function getAll(barberId?: string, date?: string): Promise<Appointment[]> {
  const params: Record<string, string> = {}
  if (barberId) params.barberId = barberId
  if (date) params.date = date
  const { data } = await api.get("/appointments", { params })
  return data
}

export async function getById(id: string): Promise<Appointment> {
  const { data } = await api.get(`/appointments/${id}`)
  return data
}

export async function create(dto: CreateAppointmentDto): Promise<Appointment> {
  const { data } = await api.post("/appointments", dto)
  return data
}

export async function update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
  const { data } = await api.patch(`/appointments/${id}`, dto)
  return data
}

export async function cancel(id: string): Promise<Appointment> {
  const { data } = await api.patch(`/appointments/${id}/cancel`)
  return data
}

export async function complete(id: string): Promise<Appointment> {
  const { data } = await api.patch(`/appointments/${id}/complete`)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`)
}
