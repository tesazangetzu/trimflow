import api from "@/lib/axios"
import type { Notification, CreateNotificationDto } from "@/types/notification"

export async function getAll(): Promise<Notification[]> {
  const { data } = await api.get("/notifications")
  return data
}

export async function getById(id: string): Promise<Notification> {
  const { data } = await api.get(`/notifications/${id}`)
  return data
}

export async function create(dto: CreateNotificationDto): Promise<Notification> {
  const { data } = await api.post("/notifications", dto)
  return data
}

export async function markSent(id: string): Promise<Notification> {
  const { data } = await api.patch(`/notifications/${id}/sent`)
  return data
}

export async function remove(id: string): Promise<void> {
  await api.delete(`/notifications/${id}`)
}
