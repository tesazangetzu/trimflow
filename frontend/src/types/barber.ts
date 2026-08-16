import type { Schedule } from "./schedule"

export interface Barber {
  id: string
  name: string
  email: string
  phone?: string
  branchId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
  schedules?: Schedule[]
}

export interface CreateBarberDto {
  name: string
  email: string
  branchId: string
  phone?: string
}

export interface UpdateBarberDto {
  name?: string
  email?: string
  phone?: string
}
