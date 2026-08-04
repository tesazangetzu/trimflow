"use client"

import { useEffect, useState, useCallback } from "react"
import { Ban, Trash2, Plus, CalendarX, Clock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import * as scheduleBlocksService from "@/services/schedule-blocks.service"
import * as barbersService from "@/services/barbers.service"
import type { AvailabilityBlock } from "@/types/schedule"
import type { Barber } from "@/types/barber"

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

function formatBlockDate(isoString: string) {
  const d = new Date(isoString)
  const dayName = DAY_NAMES[d.getDay()]
  const day = d.getDate()
  const month = MONTH_NAMES[d.getMonth()]
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return { dayName, day, month, time, full: `${dayName} ${day} ${month} ${time}` }
}

export default function BlocksPage() {
  const { user } = useAuth()
  const [barber, setBarber] = useState<Barber | null>(null)
  const [barberLoading, setBarberLoading] = useState(true)
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([])
  const [blocksLoading, setBlocksLoading] = useState(true)
  const [startDateTime, setStartDateTime] = useState("")
  const [endDateTime, setEndDateTime] = useState("")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AvailabilityBlock | null>(null)

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

  const loadBlocks = useCallback(() => {
    if (!barber) return
    setBlocksLoading(true)
    scheduleBlocksService.getAll(barber.id).then(setBlocks).finally(() => setBlocksLoading(false))
  }, [barber])

  useEffect(() => {
    const init = async () => { loadBlocks() }
    void init()
  }, [barber, loadBlocks])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barber) return
    setSubmitting(true)
    try {
      await scheduleBlocksService.create({
        barberId: barber.id,
        startDateTime: new Date(startDateTime).toISOString(),
        endDateTime: new Date(endDateTime).toISOString(),
        reason: reason || undefined,
      })
      setStartDateTime("")
      setEndDateTime("")
      setReason("")
      loadBlocks()
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await scheduleBlocksService.remove(deleteTarget.id)
    setDeleteTarget(null)
    loadBlocks()
  }

  if (!barberLoading && !barber) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <CalendarX className="size-6 text-muted-foreground" />
          <h1>Bloquear Slots</h1>
        </div>
        <Alert>
          <AlertTitle>Sin perfil de barber</AlertTitle>
          <AlertDescription>
            No encontramos un perfil de barber asociado a tu cuenta ({user?.email}).
            Contacta al administrador para que te vincule.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const upcomingBlocks = blocks.filter((b) => new Date(b.startDateTime) > new Date())
  const pastBlocks = blocks.filter((b) => new Date(b.startDateTime) <= new Date())

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
          <CalendarX className="size-5 text-destructive" />
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Bloquear Slots</h1>
          <p className="text-sm text-muted-foreground">
            Marca períodos en los que no estarás disponible
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Form */}
        <Card className="shadow-card">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded bg-primary/10">
                <Plus className="size-3.5 text-primary" />
              </div>
              Nuevo Bloque
            </CardTitle>
            <CardDescription>Selecciona el rango de tiempo a bloquear</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="start">Inicio</Label>
                <Input
                  id="start"
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">Fin</Label>
                <Input
                  id="end"
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Almuerzo, médico, etc."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={submitting || !barber} className="w-full gap-2">
                <Ban className="size-4" />
                {submitting ? "Bloqueando..." : "Bloquear Slot"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* List */}
        <Card className="shadow-card overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="flex size-6 items-center justify-center rounded bg-destructive/10">
                    <Clock className="size-3.5 text-destructive" />
                  </div>
                  Bloques Existentes
                </CardTitle>
                <CardDescription>
                  {blocks.length > 0
                    ? `Tienes ${blocks.length} bloque${blocks.length !== 1 ? "s" : ""} de disponibilidad`
                    : "No tienes bloques registrados"}
                </CardDescription>
              </div>
              {blocks.length > 0 && (
                <Badge variant="outline">
                  {upcomingBlocks.length} próximos
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {blocksLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : blocks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                  <CalendarX className="size-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium">No hay bloques definidos</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea tu primer bloque usando el formulario
                </p>
              </div>
            ) : (
              <div>
                {/* Upcoming blocks */}
                {upcomingBlocks.length > 0 && (
                  <div className="p-4 pb-0">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Próximos
                    </h4>
                    <div className="space-y-2">
                      {upcomingBlocks.map((block) => {
                        const start = formatBlockDate(block.startDateTime)
                        const end = formatBlockDate(block.endDateTime)
                        return (
                          <div
                            key={block.id}
                            className="group flex items-center justify-between rounded-lg border bg-card p-3 transition-all hover:shadow-card-hover"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-destructive/10">
                                <Ban className="size-4 text-destructive" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{start.full}</span>
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <span className="text-sm">{end.time}</span>
                                </div>
                                {block.reason && (
                                  <p className="text-xs text-muted-foreground">{block.reason}</p>
                                )}
                              </div>
                            </div>
                            <Dialog
                              open={deleteTarget?.id === block.id}
                              onOpenChange={(open) => {
                                if (!open) setDeleteTarget(null)
                              }}
                            >
                              <DialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                                  />
                                }
                                onClick={() => setDeleteTarget(block)}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Eliminar</span>
                              </DialogTrigger>
                              <DialogContent className="shadow-dialog">
                                <DialogHeader>
                                  <DialogTitle>¿Eliminar bloque?</DialogTitle>
                                  <DialogDescription>
                                    Esta acción eliminará el bloque de disponibilidad. No se puede deshacer.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-muted-foreground" />
                                    <span><strong>Inicio:</strong> {start.full}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Clock className="size-4 text-muted-foreground" />
                                    <span><strong>Fin:</strong> {end.full}</span>
                                  </div>
                                  {block.reason && (
                                    <p><strong>Motivo:</strong> {block.reason}</p>
                                  )}
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                                    Cancelar
                                  </Button>
                                  <Button variant="destructive" onClick={handleDelete} className="gap-2">
                                    <Trash2 className="size-4" />
                                    Eliminar
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Past blocks */}
                {pastBlocks.length > 0 && (
                  <div className="p-4">
                    {upcomingBlocks.length > 0 && <hr className="mb-4" />}
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Pasados
                    </h4>
                    <div className="space-y-2">
                      {pastBlocks.map((block) => {
                        const start = formatBlockDate(block.startDateTime)
                        const end = formatBlockDate(block.endDateTime)
                        return (
                          <div
                            key={block.id}
                            className="group flex items-center justify-between rounded-lg border bg-muted/20 p-3 transition-all hover:shadow-card-hover"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex size-9 items-center justify-center rounded-full bg-muted">
                                <Ban className="size-4 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-muted-foreground">{start.full}</span>
                                  <span className="text-xs text-muted-foreground">→</span>
                                  <span className="text-sm text-muted-foreground">{end.time}</span>
                                </div>
                                {block.reason && (
                                  <p className="text-xs text-muted-foreground">{block.reason}</p>
                                )}
                              </div>
                            </div>
                            <Dialog
                              open={deleteTarget?.id === block.id}
                              onOpenChange={(open) => {
                                if (!open) setDeleteTarget(null)
                              }}
                            >
                              <DialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8 text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                                  />
                                }
                                onClick={() => setDeleteTarget(block)}
                              >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Eliminar</span>
                              </DialogTrigger>
                            </Dialog>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
