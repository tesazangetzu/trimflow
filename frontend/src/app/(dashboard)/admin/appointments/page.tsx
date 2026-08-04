"use client"

import { useEffect, useState } from "react"
import { CalendarCheck, Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SkeletonTable } from "@/components/ui/skeleton-patterns"
import { AppointmentDetailDialog } from "@/components/appointments/appointment-detail-dialog"
import { AppointmentFormDialog } from "@/components/appointments/appointment-form-dialog"
import { formatDate, formatTime } from "@/components/dashboard/chart-tools"
import {
  appointmentStatusLabel,
  appointmentStatusVariant,
} from "@/lib/appointments-status"
import * as appointmentsService from "@/services/appointments.service"
import type { Appointment } from "@/types/appointment"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    appointmentsService
      .getAll()
      .then(setAppointments)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <CalendarCheck className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1>Citas</h1>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Nueva Cita
        </Button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={7} />
      ) : (
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted/30 py-3.5">Inicio</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Fin</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Estado</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Barber</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Cliente</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Servicio</TableHead>
                  <TableHead className="bg-muted/30 py-3.5 w-20 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((apt) => (
                  <TableRow
                    key={apt.id}
                    className="group transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="py-3">
                      {formatDate(apt.startTime)} {formatTime(apt.startTime)}
                    </TableCell>
                    <TableCell className="py-3">
                      {formatDate(apt.endTime)} {formatTime(apt.endTime)}
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant={appointmentStatusVariant(apt.status)}>
                        {appointmentStatusLabel(apt.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">{apt.barber?.name ?? "—"}</TableCell>
                    <TableCell className="py-3">{apt.customer?.name ?? "—"}</TableCell>
                    <TableCell className="py-3">{apt.service?.name ?? "—"}</TableCell>
                    <TableCell className="py-3 text-right">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-muted-foreground hover:text-foreground"
                              aria-label="Ver cita"
                              onClick={() => setSelectedId(apt.id)}
                            >
                              <Eye className="size-4" />
                            </Button>
                          }
                        />
                        <TooltipContent>Ver</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <AppointmentDetailDialog
        appointmentId={selectedId}
        open={selectedId !== null}
        onOpenChange={(open) => { if (!open) setSelectedId(null) }}
        allowCancel
        onStatusChange={(updated) =>
          setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
        }
      />
      <AppointmentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={(created) =>
          setAppointments((prev) => [created, ...prev])
        }
      />
    </div>
  )
}