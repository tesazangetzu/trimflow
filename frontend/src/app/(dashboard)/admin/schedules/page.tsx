"use client"

import { useEffect, useState, useCallback } from "react"
import { Clock, CalendarDays, AlertCircle, Pencil, Plus, Check, X, Trash2, User, Users, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
const PAGE_SIZE = 5

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

  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)

  const [editBarber, setEditBarber] = useState<BarberWithSchedule | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [formDayOfWeek, setFormDayOfWeek] = useState(1)
  const [formDays, setFormDays] = useState<number[]>([1])
  const [formStartTime, setFormStartTime] = useState("09:00")
  const [formEndTime, setFormEndTime] = useState("18:00")
  const [formBreakStartTime, setFormBreakStartTime] = useState("")
  const [formBreakEndTime, setFormBreakEndTime] = useState("")
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
    setEditingScheduleId(null)
    setFormDayOfWeek(1)
    setFormDays([1])
    setFormStartTime("09:00")
    setFormEndTime("18:00")
    setFormBreakStartTime("")
    setFormBreakEndTime("")
    setFormIsActive(true)
    setFormError("")
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingScheduleId(null)
    setFormDayOfWeek(1)
    setFormDays([1])
    setFormStartTime("09:00")
    setFormEndTime("18:00")
    setFormBreakStartTime("")
    setFormBreakEndTime("")
    setFormIsActive(true)
    setFormError("")
  }

  const startEdit = (barber: BarberWithSchedule, schedule: Schedule) => {
    setEditBarber(barber)
    setEditingScheduleId(schedule.id)
    setFormDayOfWeek(schedule.dayOfWeek)
    setFormStartTime(schedule.startTime.slice(0, 5))
    setFormEndTime(schedule.endTime.slice(0, 5))
    setFormBreakStartTime(schedule.breakStartTime?.slice(0, 5) ?? "")
    setFormBreakEndTime(schedule.breakEndTime?.slice(0, 5) ?? "")
    setFormIsActive(schedule.isActive)
    setFormError("")
    setDialogOpen(true)
  }

  const toggleDay = (day: number) => {
    setFormDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editBarber) return

    if (!editingScheduleId && formDays.length === 0) {
      setFormError("Selecciona al menos un día")
      return
    }

    if (formStartTime >= formEndTime) {
      setFormError("La hora de inicio debe ser anterior a la de fin")
      return
    }

    // Break: ambos o ninguno, y contenido dentro del turno.
    const hasBreakStart = formBreakStartTime.trim() !== ""
    const hasBreakEnd = formBreakEndTime.trim() !== ""
    if (hasBreakStart !== hasBreakEnd) {
      setFormError("El refrigerio debe tener hora de inicio y fin")
      return
    }
    if (hasBreakStart && hasBreakEnd) {
      if (formBreakStartTime >= formBreakEndTime) {
        setFormError("El inicio del refrigerio debe ser anterior al fin")
        return
      }
      if (formBreakStartTime < formStartTime || formBreakEndTime > formEndTime) {
        setFormError("El refrigerio debe estar dentro del horario de trabajo")
        return
      }
    }

    const breakStartTime = hasBreakStart ? formBreakStartTime : null
    const breakEndTime = hasBreakEnd ? formBreakEndTime : null

    setFormSubmitting(true)
    try {
      if (editingScheduleId) {
        await schedulesService.update(editingScheduleId, {
          startTime: formStartTime,
          endTime: formEndTime,
          breakStartTime,
          breakEndTime,
          isActive: formIsActive,
        })
      } else {
        await Promise.all(
          formDays.map((day) =>
            schedulesService.create({
              barberId: editBarber.id,
              dayOfWeek: day,
              startTime: formStartTime,
              endTime: formEndTime,
              breakStartTime,
              breakEndTime,
              isActive: formIsActive,
            }),
          ),
        )
      }
      const updated = await schedulesService.getAll(editBarber.id)
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
      setBarbers((prev) =>
        prev.map((b) => (b.id === editBarber.id ? { ...b, schedules: updated } : b)),
      )
    }
  }

  const handleDeleteFromForm = async () => {
    if (!editingScheduleId) return
    try {
      await handleDeleteSchedule(editingScheduleId)
      resetForm()
      setDialogOpen(false)
    } catch {
      setFormError("Error al eliminar. Intenta de nuevo.")
    }
  }

  const totalBarbersWithSchedule = barbers.filter((b) => b.schedules.length > 0).length
  const totalSchedules = barbers.reduce((acc, b) => acc + b.schedules.length, 0)

  const filteredBarbers = barbers.filter(
    (b) =>
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  const totalPages = Math.max(1, Math.ceil(filteredBarbers.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paginatedBarbers = filteredBarbers.slice(
    safePage * PAGE_SIZE,
    safePage * PAGE_SIZE + PAGE_SIZE,
  )

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
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(0)
              }}
              placeholder="Buscar por nombre o email..."
              aria-label="Buscar barbers por nombre o email"
              className="pl-9"
            />
          </div>

          {filteredBarbers.length === 0 ? (
            <Alert>
              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                <AlertCircle className="size-5" />
              </div>
              <AlertTitle>Sin resultados</AlertTitle>
              <AlertDescription>
                No se encontraron barbers con ese criterio de búsqueda.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {paginatedBarbers.map((barber) => (
                  <Card key={barber.id} className="shadow-card">
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
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={barber.schedules.length > 0 ? "default" : "outline"}
                            className="transition-colors text-xs"
                          >
                            {barber.schedules.length > 0
                              ? `${barber.schedules.length} día${barber.schedules.length !== 1 ? "s" : ""}`
                              : "Sin horarios"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7"
                            aria-label={`Editar horarios de ${barber.name}`}
                            onClick={() => openEditor(barber)}
                          >
                            <Pencil className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {barber.schedules.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {barber.schedules
                            .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                            .map((s) => (
                              <Button
                                key={s.id}
                                type="button"
                                variant={s.isActive ? "secondary" : "outline"}
                                size="sm"
                                className="h-6 gap-1 rounded-4xl px-2.5 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEdit(barber, s)
                                }}
                              >
                                <Clock className="size-3" />
                                {DAY_SHORT[s.dayOfWeek]}{" "}
                                {s.startTime.slice(0, 5)}-{s.endTime.slice(0, 5)}
                              </Button>
                            ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <AlertCircle className="size-4" />
                          <span>Sin horario configurado</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Página {safePage + 1} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages - 1}
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Dialog editor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent maxWidth="sm:max-w-[1000px]" className="flex max-h-[calc(100vh-4rem)] flex-col overflow-hidden shadow-dialog">
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

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-4 pr-1">
            {/* Form - fixed overflow: 2 rows instead of cramped 4 columns */}
            <form onSubmit={handleSubmit} className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <div className="flex size-5 items-center justify-center rounded bg-primary/10">
                  {editingScheduleId ? <Pencil className="size-3 text-primary" /> : <Plus className="size-3 text-primary" />}
                </div>
                {editingScheduleId ? "Editar horario" : "Agregar nuevo horario"}
              </div>

              {/* Días (solo modo crear) */}
              {!editingScheduleId && (
                <div className="mb-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Días de la semana
                  </div>
                  <div className="grid grid-cols-4 gap-2 md:grid-cols-7">
                    {DAY_NAMES.map((d) => (
                      <div
                        key={d.value}
                        className="flex items-center gap-2 rounded-md border border-input bg-background/60 px-3 py-2"
                      >
                        <Checkbox
                          id={`admin-day-${d.value}`}
                          checked={formDays.includes(d.value)}
                          onCheckedChange={() => toggleDay(d.value)}
                        />
                        <Label htmlFor={`admin-day-${d.value}`} className="cursor-pointer text-xs">{DAY_SHORT[d.value]}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Horario: Inicio | Fin | Break inicio | Break fin (o Día + estos 4 en edición) */}
              <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${editingScheduleId ? "lg:grid-cols-5" : "lg:grid-cols-4"}`}>
                {editingScheduleId && (
                  <div className="space-y-1.5">
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
                )}
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
                <div className="space-y-1.5">
                  <Label htmlFor="admin-break-start" className="text-xs">Inicio refrigerio</Label>
                  <Input
                    id="admin-break-start"
                    type="time"
                    value={formBreakStartTime}
                    onChange={(e) => setFormBreakStartTime(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="admin-break-end" className="text-xs">Fin refrigerio</Label>
                  <Input
                    id="admin-break-end"
                    type="time"
                    value={formBreakEndTime}
                    onChange={(e) => setFormBreakEndTime(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Row 3: Eliminar (solo edición) + Active toggle + action buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {editingScheduleId && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={handleDeleteFromForm}
                  >
                    <Trash2 className="size-3.5" />
                    Eliminar
                  </Button>
                )}
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
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
