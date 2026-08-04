"use client"

import { useEffect, useState } from "react"
import { Users, Pencil } from "lucide-react"
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
import { SkeletonTable } from "@/components/ui/skeleton-patterns"
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog"
import * as customersService from "@/services/customers.service"
import type { Customer } from "@/types/customer"

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)

  useEffect(() => {
    customersService
      .getAll()
      .then(setCustomers)
      .finally(() => setLoading(false))
  }, [])

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
    </div>
  )
}