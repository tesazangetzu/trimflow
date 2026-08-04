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
import * as customersService from "@/services/customers.service"
import type { Customer } from "@/types/customer"

interface CustomerFormDialogProps {
  mode: "create" | "edit"
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: Customer | null
  onCreated?: (created: Customer) => void
  onSaved?: (updated: Customer) => void
}

function CustomerFormContent({
  mode,
  entity,
  onOpenChange,
  onCreated,
  onSaved,
}: {
  mode: "create" | "edit"
  entity: Customer | null
  onOpenChange: (open: boolean) => void
  onCreated: (created: Customer) => void
  onSaved: (updated: Customer) => void
}) {
  const { add } = useToastManager()
  const [name, setName] = useState(entity?.name ?? "")
  const [email, setEmail] = useState(entity?.email ?? "")
  const [phone, setPhone] = useState(entity?.phone ?? "")
  const [notes, setNotes] = useState(entity?.notes ?? "")
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
        email: email || undefined,
        phone: phone || undefined,
        notes: notes || undefined,
      }
      if (isCreate) {
        const created = await customersService.create({ ...dto, branchId: "" })
        onCreated(created)
        add({
          title: "Cliente creado",
          description: `"${created.name}" ya está registrado.`,
          type: "success",
        })
      } else if (entity) {
        const updated = await customersService.update(entity.id, dto)
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
        err instanceof Error ? err.message : "No se pudo guardar el cliente."
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
      <div className="space-y-2">
        <Label htmlFor={`${prefix}-notes`}>Notas</Label>
        <Input
          id={`${prefix}-notes`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
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
              ? "Crear cliente"
              : "Guardar cambios"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CustomerFormDialog({
  mode,
  open,
  onOpenChange,
  entity,
  onCreated,
  onSaved,
}: CustomerFormDialogProps) {
  const isCreate = mode === "create"
  const canRender = open && (isCreate || entity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {canRender && (
        <DialogContent key={entity?.id ?? "create"} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isCreate ? "Crear cliente" : "Editar cliente"}
            </DialogTitle>
            <DialogDescription>
              {isCreate
                ? "Registra un nuevo cliente en la barbería."
                : "Actualiza los datos del cliente y guarda los cambios."}
            </DialogDescription>
          </DialogHeader>
          <CustomerFormContent
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