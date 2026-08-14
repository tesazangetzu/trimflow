"use client"

import { useEffect, useState } from "react"
import { UserCog, Plus, Mail, Phone, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { SkeletonTable } from "@/components/ui/skeleton-patterns"
import { BarberFormDialog } from "@/components/barbers/barber-form-dialog"
import { useToastManager } from "@/components/ui/toast"
import * as barbersService from "@/services/barbers.service"
import type { Barber } from "@/types/barber"

export default function BarbersPage() {
  const { add } = useToastManager()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Barber | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Barber | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    barbersService
      .getAll()
      .then(setBarbers)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await barbersService.remove(deleteTarget.id)
      setBarbers((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
      add({
        title: "Barber eliminado",
        description: `"${deleteTarget.name}" fue eliminado.`,
        type: "success",
      })
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "No se pudo eliminar el barber.")
      add({ title: "Error al eliminar", description: msg, type: "error" })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <UserCog className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1>Barbers</h1>
          <p className="text-sm text-muted-foreground">
            {barbers.length} barber{barbers.length !== 1 ? "s" : ""} registrado{barbers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="size-4" />
          Nuevo Barber
        </Button>
      </div>

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <Card className="shadow-card overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="py-3.5">Barber</TableHead>
                  <TableHead className="py-3.5">Contacto</TableHead>
                  <TableHead className="py-3.5">Teléfono</TableHead>
                  <TableHead className="w-20 py-3.5 text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {barbers.map((barber) => {
                  const initials = barber.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) || "B"
                  return (
                    <TableRow key={barber.id} className="group transition-colors hover:bg-muted/20">
                      <TableCell className="py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{barber.name}</p>
                            <p className="text-xs text-muted-foreground">{barber.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="size-3.5" />
                          {barber.email}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="size-3.5" />
                          {barber.phone || "—"}
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
                                    aria-label="Editar barber"
                                    onClick={() => {
                                      setEditing(barber)
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
                                    aria-label="Eliminar barber"
                                    onClick={() => setDeleteTarget(barber)}
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
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <BarberFormDialog
        mode={editing ? "edit" : "create"}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        entity={editing}
        onCreated={(c) => setBarbers((prev) => [c, ...prev])}
        onSaved={(u) =>
          setBarbers((prev) => prev.map((i) => (i.id === u.id ? u : i)))
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
            <DialogTitle>¿Eliminar barber?</DialogTitle>
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