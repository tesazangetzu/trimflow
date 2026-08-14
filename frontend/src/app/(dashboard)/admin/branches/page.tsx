"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { SkeletonTable } from "@/components/ui/skeleton-patterns"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Store, Plus, MapPin, Pencil, Trash2 } from "lucide-react"
import { BranchFormDialog } from "@/components/branches/branch-form-dialog"
import { useToastManager } from "@/components/ui/toast"
import * as branchesService from "@/services/branches.service"
import type { Branch } from "@/types/branch"

export default function BranchesPage() {
  const { add } = useToastManager()
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Branch | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    branchesService
      .getAll()
      .then(setBranches)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await branchesService.remove(deleteTarget.id)
      setBranches((prev) => prev.filter((b) => b.id !== deleteTarget.id))
      setDeleteTarget(null)
      add({
        title: "Sucursal eliminada",
        description: `"${deleteTarget.name}" fue eliminada.`,
        type: "success",
      })
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "No se pudo eliminar la sucursal.")
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
            <Store className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <h1>Sucursales</h1>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="mr-1.5 size-4" />
          Nueva Sucursal
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
                  <TableHead className="py-3.5">Nombre</TableHead>
                  <TableHead className="py-3.5">Teléfono</TableHead>
                  <TableHead className="py-3.5">Horario</TableHead>
                  <TableHead className="py-3.5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {branches.map((branch) => (
                  <TableRow
                    key={branch.id}
                    className="group transition-colors hover:bg-muted/20"
                  >
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <Store className="size-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-semibold">{branch.name}</div>
                          {branch.address && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="size-3" />
                              {branch.address}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">{branch.phone || "—"}</TableCell>
                    <TableCell className="py-3">
                      {branch.openingTime && branch.closingTime ? (
                        <Badge variant="outline" className="font-normal">
                          {branch.openingTime} - {branch.closingTime}
                        </Badge>
                      ) : (
                        "—"
                      )}
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
                                aria-label="Editar sucursal"
                                onClick={() => {
                                  setEditing(branch)
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
                                aria-label="Eliminar sucursal"
                                onClick={() => setDeleteTarget(branch)}
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
      <BranchFormDialog
        mode={editing ? "edit" : "create"}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        entity={editing}
        onCreated={(c) => setBranches((prev) => [c, ...prev])}
        onSaved={(u) =>
          setBranches((prev) => prev.map((i) => (i.id === u.id ? u : i)))
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
            <DialogTitle>¿Eliminar sucursal?</DialogTitle>
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