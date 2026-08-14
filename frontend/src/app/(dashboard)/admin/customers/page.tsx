"use client"

import { useEffect, useState } from "react"
import { Users, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"
import { useToastManager } from "@/components/ui/toast"
import * as customersService from "@/services/customers.service"
import type { Customer } from "@/types/customer"

export default function CustomersPage() {
  const { add } = useToastManager()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    customersService
      .getAll()
      .then(setCustomers)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await customersService.remove(deleteTarget.id)
      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id))
      setDeleteTarget(null)
      add({
        title: "Cliente eliminado",
        description: `"${deleteTarget.name}" fue eliminado.`,
        type: "success",
      })
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (err instanceof Error ? err.message : "No se pudo eliminar el cliente.")
      add({ title: "Error al eliminar", description: msg, type: "error" })
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name?: string | null) =>
    name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "C"

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1>Clientes</h1>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditing(null)
            setDialogOpen(true)
          }}
        >
          Nuevo Cliente
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
                  <TableHead className="py-3.5">Cliente</TableHead>
                  <TableHead className="py-3.5">Teléfono</TableHead>
                  <TableHead className="py-3.5">Notas</TableHead>
                  <TableHead className="py-3.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="group transition-colors hover:bg-muted/20">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="text-xs font-medium">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email || "—"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">{customer.phone || "—"}</TableCell>
                    <TableCell className="py-3 max-w-xs truncate">{customer.notes || "—"}</TableCell>
                    <TableCell className="py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                                aria-label="Editar cliente"
                                onClick={() => {
                                  setEditing(customer)
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
                                aria-label="Eliminar cliente"
                                onClick={() => setDeleteTarget(customer)}
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
      <CustomerFormDialog
        mode={editing ? "edit" : "create"}
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o)
          if (!o) setEditing(null)
        }}
        entity={editing}
        onCreated={(c) => setCustomers((prev) => [c, ...prev])}
        onSaved={(u) =>
          setCustomers((prev) => prev.map((i) => (i.id === u.id ? u : i)))
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
            <DialogTitle>¿Eliminar cliente?</DialogTitle>
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