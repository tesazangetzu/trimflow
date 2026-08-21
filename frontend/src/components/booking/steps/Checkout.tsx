"use client"

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
      <p className="wiz-step-kicker mb-2">Confirmación</p>
      <h2 className="wiz-step-title mb-1">Tus datos</h2>
      <p className="wiz-step-sub mb-6">Ingresa tu información para confirmar la reserva.</p>

      <div className="flex flex-col gap-4">
        <div className="space-y-2">
          <label htmlFor="booking-name" className="wiz-label">
            Nombre completo
          </label>
          <input
            id="booking-name"
            className="wiz-input"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Ej. Juan Pérez"
            autoComplete="name"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="booking-phone" className="wiz-label">
            Teléfono
          </label>
          <input
            id="booking-phone"
            type="tel"
            className="wiz-input"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="Ej. +56 9 1234 5678"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="booking-email" className="wiz-label">
            Email
          </label>
          <input
            id="booking-email"
            type="email"
            className="wiz-input"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="ej. juan@correo.com"
            autoComplete="email"
            required
          />
          <p className="wiz-step-sub text-xs">
            {lookupLoading
              ? "Buscando tus datos…"
              : "Si ya has reservado con este email, te rellenamos tus datos."}
          </p>
        </div>
      </div>

      <div className="wiz-card mt-6 space-y-2 p-4 text-sm">
        <div className="flex justify-between gap-3">
          <span className="wiz-option-meta">Servicio</span>
          <span className="wiz-option-title">{selectedService.name}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="wiz-option-meta">Barbero</span>
          <span className="wiz-option-title">{selectedBarber.name}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="wiz-option-meta">Fecha</span>
          <span className="wiz-option-title">{formatDate(selectedDate)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="wiz-option-meta">Hora</span>
          <span className="wiz-option-title">{selectedSlot} hs</span>
        </div>
        <div className="wiz-total-row flex justify-between gap-3 pt-3">
          <span className="wiz-option-title">Total</span>
          <span className="wiz-price font-semibold">{formatPrice(selectedService.price)}</span>
        </div>
      </div>

      {error && (
        <p
          className="mt-4 border px-3 py-2 text-sm"
          style={{
            borderColor: "color-mix(in srgb, var(--landing-danger) 40%, transparent)",
            background: "color-mix(in srgb, var(--landing-danger) 7%, transparent)",
            color: "var(--landing-danger)",
          }}
        >
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="wiz-btn wiz-btn-secondary flex-1"
          onClick={onPrev}
          disabled={submitting}
        >
          Atrás
        </button>
        <button
          type="button"
          className="wiz-btn wiz-btn-primary flex-1"
          disabled={!saveEnabled}
          onClick={onSubmit}
        >
          {submitting ? "Reservando…" : "Confirmar reserva"}
        </button>
      </div>
    </div>
  )
}