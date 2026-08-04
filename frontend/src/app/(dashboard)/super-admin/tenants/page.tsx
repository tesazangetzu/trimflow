"use client"

import { useEffect, useState } from "react"
import { Building2, Pencil, Lock, Unlock } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { TenantFormDialog } from "@/components/tenants/tenant-form-dialog"
import * as tenantsService from "@/services/tenants.service"
import type { Tenant } from "@/types/tenant"

const statusColor = (status: string) => {
  switch (status) {
    case "active": return "success" as const
    case "suspended": return "destructive" as const
    case "trial": return "warning" as const
    default: return "secondary" as const
  }
}

const statusIcon = (status: string) => {
  switch (status) {
    case "active": return "bg-emerald-500"
    case "suspended": return "bg-red-500"
    case "trial": return "bg-amber-500"
    default: return "bg-muted-foreground"
  }
}

const tenantInitials = (name: string) => {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [actionId, setActionId] = useState<string | null>(null)
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    tenantsService.getAll().then(setTenants)
  }, [])

  const handleToggle = async (tenant: Tenant) => {
    setActionId(tenant.id)
    try {
      const updated =
        tenant.status === "suspended"
          ? await tenantsService.activate(tenant.id)
          : await tenantsService.suspend(tenant.id)
      setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    } catch (err) {
      console.error("Error al cambiar estado del tenant:", err)
    } finally {
      setActionId(null)
    }
  }

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant)
    setDialogOpen(true)
  }

  const handleCreated = (created: Tenant) => {
    setTenants((prev) =>
      [created, ...prev].sort((a, b) => a.name.localeCompare(b.name)),
    )
  }

  const handleSaved = (updated: Tenant) => {
    setTenants((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Building2 className="size-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1>Tenants</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>Nuevo Tenant</Button>
      </div>
      <Card className="shadow-card overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-muted/30 py-3.5">Nombre</TableHead>
                <TableHead className="bg-muted/30 py-3.5">Email</TableHead>
                <TableHead className="bg-muted/30 py-3.5">Estado</TableHead>
                <TableHead className="bg-muted/30 py-3.5">Creado</TableHead>
                <TableHead className="bg-muted/30 py-3.5 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => {
                const isSuspended = tenant.status === "suspended"
                return (
                  <TableRow key={tenant.id} className="group transition-colors hover:bg-muted/20">
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex size-9 items-center justify-center rounded-lg text-xs font-bold text-white ${statusIcon(tenant.status)}`}>
                          {tenantInitials(tenant.name)}
                        </div>
                        <div>
                          <p className="font-semibold">{tenant.name}</p>
                          <p className="text-sm text-muted-foreground">{tenant.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">{tenant.email || "—"}</TableCell>
                    <TableCell className="py-3">
                      <Badge variant={statusColor(tenant.status)}>{tenant.status}</Badge>
                    </TableCell>
                    <TableCell className="py-3 text-muted-foreground">{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => handleEdit(tenant)}
                                aria-label="Editar tenant"
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
                                className={isSuspended ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground hover:text-destructive"}
                                onClick={() => handleToggle(tenant)}
                                disabled={actionId === tenant.id}
                                aria-label={isSuspended ? "Activar tenant" : "Suspender tenant"}
                              >
                                {isSuspended ? <Unlock className="size-4" /> : <Lock className="size-4" />}
                              </Button>
                            }
                          />
                          <TooltipContent>
                            {isSuspended ? "Activar" : "Suspender"}
                          </TooltipContent>
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
      <TenantFormDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />
      <TenantFormDialog
        mode="edit"
        tenant={editingTenant}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSaved={handleSaved}
      />
    </div>
  )
}