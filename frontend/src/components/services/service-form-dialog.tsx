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
import * as servicesService from "@/services/service-offering.service"
import type { Service } from "@/types/service"

interface ServiceFormDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: Service | null
  onCreated?: (created: Service) => void
  onSaved?: (updated: Service) => void
}

function ServiceFormContent({
  mode,
  entity,
  onOpenChange,
  onCreated,
  onSaved,
}: {
  mode: "create" | "edit"
  entity: Service | null
  onOpenChange: (open: boolean) => void
  onCreated: (created: Service) => void
  onSaved: (updated: Service) => void
}) {
  const { add } = useToastManager()
  const [name, setName] = useState(entity?.name ?? "")
  const [price, setPrice] = useState(entity ? String(entity.price) : "")
  const [durationMinutes, setDurationMinutes] = useState(
    entity ? String(entity.durationMinutes) : ""
  )
  const [description, setDescription] = useState(entity?.description ?? "")
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
        price: Number(price),
        durationMinutes: Number(durationMinutes),
        description: description || undefined,
      }
      if (isCreate) {
        const created = await servicesService.create({ ...dto, branchId: "" })
        onCreated(created)
        add({
          title: "Servicio creado",
          description: `"${created.name}" ya está disponible.`,
          type: "success",
        })
      } else if (entity) {
        const updated = await servicesService.update(entity.id, dto)
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
        err instanceof Error ? err.message : "No se pudo guardar el servicio."
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
        <Label htmlFor={`${prefix}-price`}>Precio</Label>
        <Input
          id={`${prefix}-price`}
          type="number"
          min="0"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-duration`}>Duración (minutos)</Label>
        <Input
          id={`${prefix}-duration`}
          type="number"
          min="1"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-description`}>Descripción</Label>
        <Input
          id={`${prefix}-description`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
              ? "Crear servicio"
              : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function ServiceFormDialog({
  mode,
  open,
  onOpenChange,
  entity,
  onCreated,
  onSaved,
}: ServiceFormDialogProps) {
  const isCreate = mode === "create"
  const canRender = open && (isCreate || entity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canRender && (
        <DialogContent key={entity?.id ?? "create"} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreate ? "Crear servicio" : "Editar servicio"}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? "Registra un nuevo servicio en la barbería."
                : "Actualiza los datos del servicio y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>
          <ServiceFormContent
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