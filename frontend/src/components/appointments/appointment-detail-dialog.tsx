"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import * as appointmentsService from "@/services/appointments.service"
import type { Appointment } from "@/types/appointment"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate, formatTime } from "@/components/dashboard/chart-tools"
import {
  appointmentStatusLabel,
  appointmentStatusVariant,
} from "@/lib/appointments-status"

type AppointmentDetailDialogProps = {
  appointmentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  allowCancel?: boolean
  onStatusChange?: (updated: Appointment) => void
}

export function AppointmentDetailDialog({
  appointmentId,
  open,
  onOpenChange,
  allowCancel = false,
  onStatusChange,
}: AppointmentDetailDialogProps) {
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loadedId, setLoadedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !appointmentId) return
    let cancelled = false
    appointmentsService
      .getById(appointmentId)
      .then((data) => {
        if (!cancelled) {
          setAppointment(data)
          setLoadedId(appointmentId)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo cargar la cita")
      })
    return () => {
      cancelled = true
    }
  }, [open, appointmentId])

  const loading =
    open && appointmentId !== null && loadedId !== appointmentId && error === null
  const current =
    open && appointmentId !== null && loadedId === appointmentId ? appointment : null

  const handleComplete = async () => {
    if (!appointment) return
    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await appointmentsService.complete(appointment.id)
      setAppointment(updated)
      onStatusChange?.(updated)
    } catch {
      setError("No se pudo completar la cita")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!appointment) return
    setIsSubmitting(true)
    setError(null)
    try {
      const updated = await appointmentsService.cancel(appointment.id)
      setAppointment(updated)
      onStatusChange?.(updated)
    } catch {
      setError("No se pudo cancelar la cita")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalle de Cita</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : current ? (
          <>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Inicio:</span>
                <p>{formatDate(current.startTime)} {formatTime(current.startTime)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Fin:</span>
                <p>{formatDate(current.endTime)} {formatTime(current.endTime)}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Barber:</span>
                <p>{current.barber?.name ?? "—"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Cliente:</span>
                <p>{current.customer?.name ?? "—"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Servicio:</span>
                <p>{current.service?.name ?? "—"}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Estado:</span>
                <div className="mt-1">
                  <Badge variant={appointmentStatusVariant(current.status)}>
                    {appointmentStatusLabel(current.status)}
                  </Badge>
                </div>
              </div>
              {current.notes && (
                <div>
                  <span className="text-sm text-muted-foreground">Notas:</span>
                  <p>{current.notes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              {current.status === "scheduled" && (
                <Button onClick={handleComplete} disabled={isSubmitting}>
                  Completar
                </Button>
              )}
              {allowCancel && current.status === "scheduled" && (
                <Button variant="destructive" onClick={handleCancel} disabled={isSubmitting}>
                  Cancelar
                </Button>
              )}
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
