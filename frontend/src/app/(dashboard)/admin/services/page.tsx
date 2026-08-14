"use client"

import { useEffect, useState } from "react"
import { Plus, Clock, Pencil, Scissors, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SkeletonTable } from "@/components/ui/skeleton-patterns"
import { ServiceFormDialog } from "@/components/services/service-form-dialog"
import { formatCurrency } from "@/components/dashboard/chart-tools"
import { useToastManager } from "@/components/ui/toast"
import * as servicesService from "@/services/service-offering.service"
import type { Service } from "@/types/service"

export default function ServicesPage() {
  const { add } = useToastManager()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    servicesService
      .getAll()
      .then(setServices)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await servicesService.remove(deleteTarget.id)
      setServices((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
      add({
        title: "Servicio eliminado",
        description: `"${deleteTarget.name}" fue eliminado.`,
        type: "success",
      })
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "No se pudo eliminar el servicio.")
      add({ title: "Error al eliminar", description: msg, type: "error" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Scissors className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1>Servicios</h1>
          </div>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nuevo Servicio
        </Button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-muted/30 py-3.5">Servicio</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Precio</TableHead>
                  <TableHead className="bg-muted/30 py-3.5">Duración</TableHead>
                  <TableHead className="bg-muted/30 py-3.5 w-20 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow
                    key={service.id}
                    className="group transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                          <Scissors className="size-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Badge variant="secondary" className="gap-1.5 font-mono text-sm">
                        {formatCurrency(service.price)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Clock className="size-4" />
                        {service.durationMinutes} min
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Editar servicio"
                                onClick={() => {
                                  setEditing(service)
                                  setDialogOpen(true)
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent>Editar</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Eliminar servicio"
                                onClick={() => setDeleteTarget(service)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            }
                          />
                          <TooltipContent>Eliminar</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <ServiceFormDialog
        mode={editing ? "edit" : "create"}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        entity={editing}
        onCreated={(c) => setServices((prev) => [c, ...prev])}
        onSaved={(u) =>
          setServices((prev) => prev.map((i) => (i.id === u.id ? u : i)))
        }
      />
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-md shadow-dialog">
          <DialogHeader>
            <DialogTitle>¿Eliminar servicio?</DialogTitle>
            <DialogDescription>
              Esta acción eliminará «{deleteTarget?.name}». No se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              <Trash2 className="size-4" />
              {deleting ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}