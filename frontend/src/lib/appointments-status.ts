import type { AppointmentStatus } from "@/types/appointment"

export const APPOINTMENT_STATUS: Record<
  AppointmentStatus,
  { label: string; variant: "default" | "success" | "destructive" | "warning" | "outline" }
> = {
  scheduled: { label: "Programada", variant: "default" },
  completed: { label: "Completada", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
  "no-show": { label: "No asistió", variant: "warning" },
}

export function appointmentStatusLabel(status: AppointmentStatus): string {
  return APPOINTMENT_STATUS[status]?.label ?? status
}

export function appointmentStatusVariant(status: AppointmentStatus) {
  return APPOINTMENT_STATUS[status]?.variant ?? "outline"
}