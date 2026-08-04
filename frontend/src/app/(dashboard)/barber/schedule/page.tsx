"use client"

import { useEffect, useState, useCallback } from "react"
import { Clock, CalendarDays, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import * as schedulesService from "@/services/schedules.service"
import * as barbersService from "@/services/barbers.service"
import type { Schedule } from "@/types/schedule"
import type { Barber } from "@/types/barber"

const DAY_NAMES = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
]

export default function BarberSchedulePage() {
  const { user } = useAuth()
  const [barber, setBarber] = useState<Barber | null>(null)
  const [barberLoading, setBarberLoading] = useState(true)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [schedulesLoading, setSchedulesLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      if (!user?.email) {
        setBarberLoading(false)
        return
      }
      const all = await barbersService.getAll()
      const found = all.find((b) => b.email === user.email) ?? null
      setBarber(found)
      setBarberLoading(false)
    }
    void load()
  }, [user?.email])

  const loadSchedules = useCallback(() => {
    if (!barber) return
    setSchedulesLoading(true)
    schedulesService.getAll(barber.id).then(setSchedules).finally(() => setSchedulesLoading(false))
  }, [barber])

  useEffect(() => {
    const init = async () => { loadSchedules() }
    void init()
  }, [barber, loadSchedules])

  const getScheduleForDay = (day: number) => schedules.find((s) => s.dayOfWeek === day)

  if (!barberLoading && !barber) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Clock className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1>Horario Semanal</h1>
          </div>
        </div>
        <Alert>
          <AlertTitle>Sin perfil de barber</AlertTitle>
          <AlertDescription>
            No encontramos un perfil de barber asociado a tu cuenta ({user?.email}).
            Contacta al administrador.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const activeDays = schedules.filter((s) => s.isActive).length
  const totalDays = schedules.length

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <CalendarDays className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1>Horario Semanal</h1>
          <p className="text-sm text-muted-foreground">
            Tu disponibilidad registrada — si necesitas cambios, contacta al administrador
          </p>
        </div>
      </div>

      {/* Stats cards */}
      {!schedulesLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Días configurados</CardDescription>
              <CardTitle className="text-2xl">{totalDays}/7</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-card bg-gradient-brand text-white">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider text-white/80">Días activos</CardDescription>
              <CardTitle className="text-2xl text-white">{activeDays}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Inactivos</CardDescription>
              <CardTitle className="text-2xl">{totalDays - activeDays}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2 pt-4">
              <CardDescription className="text-xs font-medium uppercase tracking-wider">Sin configurar</CardDescription>
              <CardTitle className="text-2xl">{7 - totalDays}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      <Card className="shadow-card overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mi Disponibilidad Semanal</CardTitle>
              <CardDescription>
                {totalDays > 0
                  ? `Tienes ${totalDays} día${totalDays !== 1 ? "s" : ""} configurado${totalDays !== 1 ? "s" : ""}`
                  : "Aún no tienes horarios configurados"}
              </CardDescription>
            </div>
            {totalDays > 0 && (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {activeDays} activos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {schedulesLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-32">Día</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead className="w-20">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {DAY_NAMES.map((day) => {
                  const schedule = getScheduleForDay(day.value)
                  return (
                    <TableRow key={day.value} className="transition-colors hover:bg-muted/20">
                      <TableCell className="font-medium py-3">{day.label}</TableCell>
                      <TableCell className="py-3">
                        {schedule ? (
                          <div className="flex items-center gap-2.5">
                            <div className="flex size-7 items-center justify-center rounded-md bg-primary/10">
                              <Clock className="size-3.5 text-primary" />
                            </div>
                            <span className="font-mono text-sm font-semibold">
                              {schedule.startTime.slice(0, 5)} — {schedule.endTime.slice(0, 5)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="py-3">
                        {schedule ? (
                          <Badge
                            variant={schedule.isActive ? "default" : "secondary"}
                            className="gap-1 text-xs"
                          >
                            {schedule.isActive ? (
                              <CheckCircle2 className="size-3" />
                            ) : (
                              <XCircle className="size-3" />
                            )}
                            {schedule.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Pendiente</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Alert variant="default" className="border-primary/20 bg-primary/[0.03]">
        <Clock className="size-4" />
        <AlertTitle>Horario de atención</AlertTitle>
        <AlertDescription>
          Este es tu horario registrado. Si necesitas modificarlo, contacta al administrador del sistema.
        </AlertDescription>
      </Alert>
    </div>
  )
}
