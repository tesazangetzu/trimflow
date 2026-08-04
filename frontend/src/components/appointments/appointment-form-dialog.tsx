"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToastManager } from "@/components/ui/toast"
import * as appointmentsService from "@/services/appointments.service"
import * as barbersService from "@/services/barbers.service"
import * as customersService from "@/services/customers.service"
import * as servicesService from "@/services/service-offering.service"
import type { Appointment } from "@/types/appointment"
import type { Barber } from "@/types/barber"
import type { Customer } from "@/types/customer"
import type { Service } from "@/types/service"

interface AppointmentFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: (created: Appointment) => void
}

function AppointmentFormContent({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (open: boolean) => void
  onCreated: (created: Appointment) => void
}) {
  const { add } = useToastManager()
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [barberId, setBarberId] = useState("")
  const [customerId, setCustomerId] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([
      barbersService.getAll(),
      customersService.getAll(),
      servicesService.getAll(),
    ])
      .then(([b, c, s]) => {
        if (!active) return
        setBarbers(b)
        setCustomers(c)
        setServices(s)
      })
      .catch((err) => {
        if (!active) return
        const msg =
          err instanceof Error
            ? err.message
            : "No se pudo cargar la información de la cita."
        setError(msg)
      })
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const created = await appointmentsService.create({
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        barberId,
        customerId,
        serviceId,
        notes: notes || undefined,
      })
      onCreated(created)
      add({
        title: "Cita creada",
        description: "La cita se registró correctamente.",
        type: "success",
      })
      onOpenChange(false)
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "No se pudo crear la cita."
      setError(msg)
      add({
        title: "Error al crear",
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
        <Label htmlFor="appointment-start">Inicio</Label>
        <Input
          id="appointment-start"
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-end">Fin</Label>
        <Input
          id="appointment-end"
          type="datetime-local"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-barber">Barber</Label>
        <Select value={barberId} onValueChange={(v) => setBarberId(v ?? "")}>
          <SelectTrigger id="appointment-barber" className="w-full">
            <SelectValue placeholder="Selecciona un barber..." />
          </SelectTrigger>
          <SelectContent>
            {barbers.map((barber) => (
              <SelectItem key={barber.id} value={barber.id}>
                {barber.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-customer">Cliente</Label>
        <Select value={customerId} onValueChange={(v) => setCustomerId(v ?? "")}>
          <SelectTrigger id="appointment-customer" className="w-full">
            <SelectValue placeholder="Selecciona un cliente..." />
          </SelectTrigger>
          <SelectContent>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-service">Servicio</Label>
        <Select value={serviceId} onValueChange={(v) => setServiceId(v ?? "")}>
          <SelectTrigger id="appointment-service" className="w-full">
            <SelectValue placeholder="Selecciona un servicio..." />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.id} value={service.id}>
                {service.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="appointment-notes">Notas</Label>
        <Input
          id="appointment-notes"
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
          {loading ? "Creando..." : "Crear Cita"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AppointmentFormDialog({
  open,
  onOpenChange,
  onCreated,
}: AppointmentFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open && (
        <DialogContent key="create" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Cita</DialogTitle>
            <DialogDescription>
              Registra una nueva cita en la barbería.
            </DialogDescription>
          </DialogHeader>
          <AppointmentFormContent
            onOpenChange={onOpenChange}
            onCreated={onCreated ?? (() => {})}
          />
        </DialogContent>
      )}
    </Dialog>
  )
}