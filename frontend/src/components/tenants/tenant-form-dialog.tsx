"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToastManager } from "@/components/ui/toast"
import * as tenantsService from "@/services/tenants.service"
import { slugify } from "@/lib/slugify"
import type { Tenant } from "@/types/tenant"

interface TenantFormDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  tenant?: Tenant | null
  onCreated?: (created: Tenant) => void
  onSaved?: (updated: Tenant) => void
}

function TenantFormContent({
  mode,
  tenant,
  onOpenChange,
  onCreated,
  onSaved,
}: {
  mode: "create" | "edit"
  tenant: Tenant | null
  onOpenChange: (open: boolean) => void
  onCreated: (created: Tenant) => void
  onSaved: (updated: Tenant) => void
}) {
  const { add } = useToastManager()
  const [name, setName] = useState(tenant?.name ?? "")
  const [slug, setSlug] = useState(tenant?.slug ?? "")
  const [email, setEmail] = useState(tenant?.email ?? "")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  const isCreate = mode === "create"
  const prefix = isCreate ? "create" : "edit"

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-genera el slug desde el nombre solo si el usuario aún no lo editó manualmente.
    if (isCreate && !slugEdited) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlug(value)
    setSlugEdited(true)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const dto = {
        name,
        slug,
        email: email || undefined,
      }
      if (isCreate) {
        const created = await tenantsService.create(dto)
        onCreated(created)
        add({
          title: "Tenant creado",
          description: `"${created.name}" ya está listo para usarse.`,
          type: "success",
        })
      } else if (tenant) {
        const updated = await tenantsService.update(tenant.id, dto)
        onSaved(updated)
        add({
          title: "Cambios guardados",
          description: `Se actualizaron los datos de "${updated.name}".`,
          type: "success",
        })
      }
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo guardar el tenant."
      setError(msg)
      add({
        title: isCreate ? "Error al crear" : "Error al guardar",
        description: msg,
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-name`}>Nombre</Label>
        <Input
          id={`${prefix}-name`}
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-slug`}>Slug</Label>
        <Input
          id={`${prefix}-slug`}
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          required
          aria-invalid={error ? true : undefined}
        />
        <p className="text-xs text-muted-foreground">
          {isCreate
            ? "Se genera automáticamente desde el nombre. Puedes editarlo; se usa en la URL pública."
            : "Minúsculas, sin espacios; se usa en la URL del tenant."}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-email`}>Email</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? isCreate
              ? "Creando..."
              : "Guardando..."
            : isCreate
              ? "Crear tenant"
              : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function TenantFormDialog({
  mode,
  open,
  onOpenChange,
  tenant,
  onCreated,
  onSaved,
}: TenantFormDialogProps) {
  const isCreate = mode === "create"
  const canRender = open && (isCreate || tenant)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canRender && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreate ? "Crear tenant" : "Editar tenant"}</DialogTitle>
            <DialogDescription>
              {isCreate
                ? "Configura una nueva barbería para el espacio de trabajo."
                : "Actualiza los datos de la barbería y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>
          <TenantFormContent
            mode={mode}
            tenant={tenant ?? null}
            onOpenChange={onOpenChange}
            onCreated={onCreated ?? (() => {})}
            onSaved={onSaved ?? (() => {})}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}