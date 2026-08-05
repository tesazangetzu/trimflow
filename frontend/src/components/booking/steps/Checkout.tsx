"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { WizardService } from "@/hooks/booking/use-booking"
import type { PublicBarber } from "@/types/public"

interface CheckoutProps {
  selectedService: WizardService
  selectedBarber: PublicBarber
  selectedDate: string
  selectedSlot: string
  name: string
  phone: string
  email: string
  lookupLoading: boolean
  saveEnabled: boolean
  submitting: boolean
  error: string | null
  onNameChange: (value: string) => void
  onPhoneChange: (value: string) => void
  onEmailChange: (value: string) => void
  onPrev: () => void
  onSubmit: () => void
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date)
}

export function Checkout({
  selectedService,
  selectedBarber,
  selectedDate,
  selectedSlot,
  name,
  phone,
  email,
  lookupLoading,
  saveEnabled,
  submitting,
  error,
  onNameChange,
  onPhoneChange,
  onEmailChange,
  onPrev,
  onSubmit,
}: CheckoutProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Tus datos</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Ingresa tu información para confirmar la reserva.
      </p>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <Label htmlFor="booking-name">Nombre completo</Label>
          <Input
            id="booking-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej. Juan Pérez"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-phone">Teléfono</Label>
          <Input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Ej. +56 9 1234 5678"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="booking-email">Email</Label>
          <Input
            id="booking-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="ej. juan@correo.com"
            autoComplete="email"
            required
          />
          <p className="text-xs text-muted-foreground">
            {lookupLoading
              ? "Buscando tus datos…"
              : "Si ya has reservado con este email, te rellenamos tus datos."}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-2 rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Servicio</span>
          <span className="font-medium text-foreground">{selectedService.name}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Barbero</span>
          <span className="font-medium text-foreground">{selectedBarber.name}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Fecha</span>
          <span className="font-medium text-foreground">{formatDate(selectedDate)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Hora</span>
          <span className="font-medium text-foreground">{selectedSlot} hs</span>
        </div>
        <div className="flex justify-between gap-3 border-t border-border pt-2">
          <span className="font-medium text-foreground">Total</span>
          <span className="font-semibold text-foreground">
            {formatPrice(selectedService.price)}
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1 py-3.5" onClick={onPrev} disabled={submitting}>
          Atrás
        </Button>
        <Button className="flex-1 py-3.5" disabled={!saveEnabled} onClick={onSubmit}>
          {submitting ? "Reservando…" : "Confirmar reserva"}
        </Button>
      </div>
    </div>
  )
}