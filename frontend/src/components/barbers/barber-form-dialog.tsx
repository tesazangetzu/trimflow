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
import * as barbersService from "@/services/barbers.service"
import type { Barber } from "@/types/barber"

interface BarberFormDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: Barber | null
  onCreated?: (created: Barber) => void
  onSaved?: (updated: Barber) => void
}

function BarberFormContent({
  mode,
  entity,
  onOpenChange,
  onCreated,
  onSaved,
}: {
  mode: "create" | "edit"
  entity: Barber | null
  onOpenChange: (open: boolean) => void
  onCreated: (created: Barber) => void
  onSaved: (updated: Barber) => void
}) {
  const { add } = useToastManager()
  const [name, setName] = useState(entity?.name ?? "")
  const [email, setEmail] = useState(entity?.email ?? "")
  const [phone, setPhone] = useState(entity?.phone ?? "")
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
        email,
        phone: phone || undefined,
      }
      if (isCreate) {
        const created = await barbersService.create({ ...dto, branchId: "" })
        onCreated(created)
        add({
          title: "Barber creado",
          description: `"${created.name}" ya está disponible.`,
          type: "success",
        })
      } else if (entity) {
        const updated = await barbersService.update(entity.id, dto)
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
        err instanceof Error ? err.message : "No se pudo guardar el barber."
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
        <Label htmlFor={`${prefix}-email`}>Email</Label>
        <Input
          id={`${prefix}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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
              ? "Crear barber"
              : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function BarberFormDialog({
  mode,
  open,
  onOpenChange,
  entity,
  onCreated,
  onSaved,
}: BarberFormDialogProps) {
  const isCreate = mode === "create"
  const canRender = open && (isCreate || entity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canRender && (
        <DialogContent key={entity?.id ?? "create"} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isCreate ? "Crear barber" : "Editar barber"}</DialogTitle>
            <DialogDescription>
              {isCreate
                ? "Registra un nuevo barber en la barbería."
                : "Actualiza los datos del barber y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>
          <BarberFormContent
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