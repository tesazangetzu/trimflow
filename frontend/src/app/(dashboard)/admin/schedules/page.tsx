"use client"

import { useEffect, useState, useCallback } from "react"
import { Clock, CalendarDays, AlertCircle, Pencil, Plus, Check, X, Trash2, User, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import * as barbersService from "@/services/barbers.service"
import * as schedulesService from "@/services/schedules.service"
import type { Barber } from "@/types/barber"
import type { Schedule } from "@/types/schedule"

const DAY_NAMES = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
]
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface BarberWithSchedule extends Barber {
  schedules: Schedule[]
}

function StatCard({ label, value, icon: Icon, gradient = false }: {
  label: string
  value: string | number
  icon: typeof Clock
  gradient?: boolean
}) {
  return (
    <Card className={`shadow-card ${gradient ? "bg-gradient-brand text-white" : ""}`}>
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-center justify-between">
          <CardDescription className={`text-xs font-medium uppercase tracking-wider ${gradient ? "text-white/80" : ""}`}>
            {label}
          </CardDescription>
          <div className={`flex size-8 items-center justify-center rounded-lg ${gradient ? "bg-white/20" : "bg-primary/10"}`}>
            <Icon className={`size-4 ${gradient ? "text-white" : "text-primary"}`} />
          </div>
        </div>
        <CardTitle className={`text-2xl ${gradient ? "text-white" : ""}`}>{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

export default function AdminSchedulesPage() {
  const [barbers, setBarbers] = useState<BarberWithSchedule[]>([])
  const [loading, setLoading] = useState(true)

  const [editBarber, setEditBarber] = useState<BarberWithSchedule | null>(null)
  const [editSchedules, setEditSchedules] = useState<Schedule[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formDayOfWeek, setFormDayOfWeek] = useState(1)
  const [formStartTime, setFormStartTime] = useState("09:00")
  const [formEndTime, setFormEndTime] = useState("18:00")
  const [formIsActive, setFormIsActive] = useState(true)
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  const loadAll = useCallback(async () => {
    setLoading(true)
    const allBarbers = await barbersService.getAll()
    const withSchedules = await Promise.all(
      allBarbers.map(async (b) => {
        const schedules = await schedulesService.getAll(b.id)
        return { ...b, schedules }
      }),
    )
    setBarbers(withSchedules)
    setLoading(false)
  }, [])

  useEffect(() => {
    const init = async () => { await loadAll() }
    void init()
  }, [loadAll])

  const openEditor = (barber: BarberWithSchedule) => {
    setEditBarber(barber)
    setEditSchedules([...barber.schedules])
    setEditingScheduleId(null)
    setFormDayOfWeek(1)
    setFormStartTime("09:00")
    setFormEndTime("18:00")
    setFormIsActive(true)
    setFormError("")
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingScheduleId(null)
    setFormDayOfWeek(1)
    setFormStartTime("09:00")
    setFormEndTime("18:00")
    setFormIsActive(true)
    setFormError("")
  }

  const startEdit = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id)
    setFormDayOfWeek(schedule.dayOfWeek)
    setFormStartTime(schedule.startTime.slice(0, 5))
    setFormEndTime(schedule.endTime.slice(0, 5))
    setFormIsActive(schedule.isActive)
    setFormError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBarber) return

    if (formStartTime >= formEndTime) {
      setFormError("La hora de inicio debe ser anterior a la de fin")
      return
    }

    setFormSubmitting(true)
    try {
      if (editingScheduleId) {
        await schedulesService.update(editingScheduleId, {
          startTime: formStartTime,
          endTime: formEndTime,
          isActive: formIsActive,
        })
      } else {
        await schedulesService.create({
          barberId: editBarber.id,
          dayOfWeek: formDayOfWeek,
          startTime: formStartTime,
          endTime: formEndTime,
          isActive: formIsActive,
        })
      }
      const updated = await schedulesService.getAll(editBarber.id)
      setEditSchedules(updated)
      setBarbers((prev) =>
        prev.map((b) => (b.id === editBarber.id ? { ...b, schedules: updated } : b)),
      )
      resetForm()
    } catch {
      setFormError("Error al guardar. Intenta de nuevo.")
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    await schedulesService.remove(scheduleId)
    if (editBarber) {
      const updated = await schedulesService.getAll(editBarber.id)
      setEditSchedules(updated)
      setBarbers((prev) =>
        prev.map((b) => (b.id === editBarber.id ? { ...b, schedules: updated } : b)),
      )
    }
  }

  const totalBarbersWithSchedule = barbers.filter((b) => b.schedules.length > 0).length
  const totalSchedules = barbers.reduce((acc, b) => acc + b.schedules.length, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <CalendarDays className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1>Horarios de Barbers</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona la disponibilidad semanal de cada barber
          </p>
        </div>
      </div>

      {/* Stats - Purity UI style */}
      {!loading && barbers.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Barbers" value={barbers.length} icon={Users} />
          <StatCard label="Con horarios" value={totalBarbersWithSchedule} icon={Clock} gradient />
          <StatCard label="Sin horarios" value={barbers.length - totalBarbersWithSchedule} icon={AlertCircle} />
          <StatCard label="Total horarios" value={totalSchedules} icon={CalendarDays} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-20" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : barbers.length === 0 ? (
        <Alert>
          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
            <AlertCircle className="size-5" />
          </div>
          <AlertTitle>Sin barbers</AlertTitle>
          <AlertDescription>
            No hay barbers registrados en el sistema.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <Card
              key={barber.id}
              className="group cursor-pointer shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
              onClick={() => openEditor(barber)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
                      <User className="size-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{barber.name}</CardTitle>
                      <CardDescription className="text-xs">{barber.email}</CardDescription>
                    </div>
                  </div>
                  <Badge
                    variant={barber.schedules.length > 0 ? "default" : "outline"}
                    className="transition-colors text-xs"
                  >
                    {barber.schedules.length > 0
                      ? `${barber.schedules.length} día${barber.schedules.length !== 1 ? "s" : ""}`
                      : "Sin horarios"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {barber.schedules.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {barber.schedules
                      .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                      .map((s) => (
                        <Badge
                          key={s.id}
                          variant={s.isActive ? "secondary" : "outline"}
                          className="gap-1 px-2.5 py-1 text-xs"
                        >
                          <Clock className="size-3" />
                          {DAY_SHORT[s.dayOfWeek]}{" "}
                          {s.startTime.slice(0, 5)}-{s.endTime.slice(0, 5)}
                        </Badge>
                      ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="size-4" />
                    <span>Sin horario — haz clic para configurar</span>
                  </div>
                )}
                <div className="mt-3 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs opacity-0 transition-all group-hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); openEditor(barber) }}
                  >
                    <Pencil className="size-3.5" />
                    Editar horarios
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog editor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl shadow-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded bg-primary/10">
                <CalendarDays className="size-4 text-primary" />
              </div>
              Horarios de {editBarber?.name}
            </DialogTitle>
            <DialogDescription>
              Gestiona la disponibilidad semanal del barber
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Form - fixed overflow: 2 rows instead of cramped 4 columns */}
            <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                  {editingScheduleId ? <Pencil className="size-3 text-primary" /> : <Plus className="size-3 text-primary" />}
                </div>
                {editingScheduleId ? "Editar horario" : "Agregar nuevo horario"}
              </div>

              {/* Row 1: Día | Inicio | Fin */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor="admin-day" className="text-xs">Día</Label>
                  <select
                    id="admin-day"
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={formDayOfWeek}
                    onChange={(e) => setFormDayOfWeek(Number(e.target.value))}
                    disabled={!!editingScheduleId}
                  >
                    {DAY_NAMES.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-start" className="text-xs">Inicio</Label>
                  <Input
                    id="admin-start"
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-end" className="text-xs">Fin</Label>
                  <Input
                    id="admin-end"
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    required
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 2: Active toggle + action buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={formIsActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className="h-9 gap-1.5"
                >
                  {formIsActive ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                  {formIsActive ? "Activo" : "Inactivo"}
                </Button>

                <div className="ml-auto flex items-center gap-1.5">
                  {editingScheduleId && (
                    <Button type="button" variant="ghost" size="sm" className="h-9 gap-1.5" onClick={resetForm}>
                      <X className="size-3.5" />
                      Cancelar
                    </Button>
                  )}
                  <Button type="submit" size="sm" className="h-9 gap-1.5" disabled={formSubmitting}>
                    {editingScheduleId ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    {formSubmitting ? "Guardando..." : editingScheduleId ? "Actualizar" : "Agregar"}
                  </Button>
                </div>
              </div>

              {formError && <p className="mt-2 text-xs text-destructive">{formError}</p>}
            </form>

            <Separator />

            {/* Schedules table */}
            <div>
              <h4 className="mb-3 text-sm font-medium">Horarios configurados</h4>
              {editSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                    <Clock className="size-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No hay horarios configurados</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Usa el formulario de arriba para agregar un horario
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead>Día</TableHead>
                        <TableHead>Horario</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="w-20 text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {editSchedules
                        .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                        .map((s) => (
                          <TableRow key={s.id} className="group transition-colors hover:bg-muted/20">
                            <TableCell className="font-medium">{DAY_NAMES[s.dayOfWeek].label}</TableCell>
                            <TableCell className="font-mono text-sm">
                              <div className="flex items-center gap-2">
                                <div className="flex size-6 items-center justify-center rounded bg-primary/10">
                                  <Clock className="size-3.5 text-primary" />
                                </div>
                                {s.startTime.slice(0, 5)} — {s.endTime.slice(0, 5)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={s.isActive ? "default" : "secondary"} className="text-xs">
                                {s.isActive ? "Activo" : "Inactivo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 opacity-60 transition-all hover:opacity-100"
                                  onClick={() => startEdit(s)}
                                >
                                  <Pencil className="size-3.5" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => handleDeleteSchedule(s.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                  <span className="sr-only">Eliminar</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
