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
import * as branchesService from "@/services/branches.service"
import type { Branch } from "@/types/branch"

interface BranchFormDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: Branch | null
  onCreated?: (created: Branch) => void
  onSaved?: (updated: Branch) => void
}

function BranchFormContent({
  mode,
  entity,
  onOpenChange,
  onCreated,
  onSaved,
}: {
  mode: "create" | "edit"
  entity: Branch | null
  onOpenChange: (open: boolean) => void
  onCreated: (created: Branch) => void
  onSaved: (updated: Branch) => void
}) {
  const { add } = useToastManager()
  const [name, setName] = useState(entity?.name ?? "")
  const [address, setAddress] = useState(entity?.address ?? "")
  const [phone, setPhone] = useState(entity?.phone ?? "")
  const [openingTime, setOpeningTime] = useState(
    entity?.openingTime ? entity.openingTime.slice(0, 5) : "",
  )
  const [closingTime, setClosingTime] = useState(
    entity?.closingTime ? entity.closingTime.slice(0, 5) : "",
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isCreate = mode === "create"
  const prefix = isCreate ? "create" : "edit"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const dto = {
        name,
        address: address || undefined,
        phone: phone || undefined,
        openingTime: openingTime || undefined,
        closingTime: closingTime || undefined,
      }
      if (isCreate) {
        const created = await branchesService.create({ ...dto, tenantId: "" })
        onCreated(created)
        add({
          title: "Sucursal creada",
          description: `"${created.name}" ya está disponible.`,
          type: "success",
        })
      } else if (entity) {
        const updated = await branchesService.update(entity.id, dto)
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
        err instanceof Error ? err.message : "No se pudo guardar la sucursal."
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
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-address`}>Dirección</Label>
        <Input
          id={`${prefix}-address`}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-phone`}>Teléfono</Label>
        <Input
          id={`${prefix}-phone`}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-opening-time`}>Apertura</Label>
          <Input
            id={`${prefix}-opening-time`}
            type="time"
            value={openingTime}
            onChange={(e) => setOpeningTime(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-closing-time`}>Cierre</Label>
          <Input
            id={`${prefix}-closing-time`}
            type="time"
            value={closingTime}
            onChange={(e) => setClosingTime(e.target.value)}
          />
        </div>
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
              ? "Crear sucursal"
              : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BranchFormDialog({
  mode,
  open,
  onOpenChange,
  entity,
  onCreated,
  onSaved,
}: BranchFormDialogProps) {
  const isCreate = mode === "create"
  const canRender = open && (isCreate || entity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canRender && (
        <DialogContent key={entity?.id ?? "create"} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreate ? "Crear sucursal" : "Editar sucursal"}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? "Registra una nueva sucursal para la barbería."
                : "Actualiza los datos de la sucursal y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>
          <BranchFormContent
            mode={mode}
            entity={entity ?? null}
            onOpenChange={onOpenChange}
            onCreated={onCreated ?? (() => {})}
            onSaved={onSaved ?? (() => {})}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}