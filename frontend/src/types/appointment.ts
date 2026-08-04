import type { Barber } from "./barber"
import type { Customer } from "./customer"
import type { Service } from "./service"

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show"

export interface Appointment {
  id: string
  startTime: string
  endTime: string
  status: AppointmentStatus
  notes?: string
  barberId: string
  customerId: string
  serviceId: string
  barber?: Barber
  customer?: Customer
  service?: Service
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateAppointmentDto {
  startTime: string
  endTime: string
  barberId: string
  customerId: string
  serviceId: string
  notes?: string
}

export interface UpdateAppointmentDto {
  startTime?: string
  endTime?: string
  notes?: string
}
