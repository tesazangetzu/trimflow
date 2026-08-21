"use client"

import type { AppointmentResult, PublicBranch } from "@/types/public"

interface SuccessProps {
  appointment: AppointmentResult
  shopName: string
  branch: PublicBranch | null
  selectedDate: string
  selectedSlot: string
  slug: string
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-")
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return new Intl.DateTimeFormat("es-CL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(date)
}

export function Success({
  appointment,
  shopName,
  branch,
  selectedDate,
  selectedSlot,
  slug,
}: SuccessProps) {
  return (
    <div className="py-2 text-center">
      <div
        className="mx-auto mb-4 flex h-16 w-16 items-center justify-center border text-3xl"
        style={{
          borderColor: "color-mix(in srgb, var(--landing-accent) 40%, transparent)",
          color: "var(--landing-accent)",
        }}
        aria-hidden
      >
        ✓
      </div>
      <p className="wiz-step-kicker mb-2">Reserva confirmada</p>
      <h2
        className="text-xl uppercase"
        style={{ fontFamily: "var(--landing-font-display)", letterSpacing: "0.04em", color: "var(--landing-fg)" }}
      >
        ¡Nos vemos pronto!
      </h2>
      <p className="wiz-step-sub mx-auto mt-2 max-w-xs text-sm">
        Te esperamos en {shopName} el horario que elegiste.
      </p>

      <div className="wiz-card mx-auto mt-6 max-w-sm space-y-2 p-5 text-left text-sm">
        <p className="wiz-option-meta">Reserva #{appointment.id.slice(0, 8)}</p>
        <div className="flex justify-between gap-3">
          <span className="wiz-step-sub">Día</span>
          <span className="wiz-option-title capitalize">{formatDate(selectedDate)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="wiz-step-sub">Hora</span>
          <span className="wiz-option-title" style={{ fontFamily: "var(--landing-font-mono)" }}>
            {selectedSlot} hs
          </span>
        </div>
        {branch && (
          <div className="flex justify-between gap-3">
            <span className="wiz-step-sub">Sucursal</span>
            <span className="wiz-option-title">{branch.name}</span>
          </div>
        )}
        {branch?.address && (
          <div className="flex justify-between gap-3">
            <span className="wiz-step-sub">Dirección</span>
            <span className="wiz-option-title">{branch.address}</span>
          </div>
        )}
      </div>

      <p className="wiz-step-sub mt-5 text-xs">Enviaremos la confirmación al email indicado.</p>

      <a
        href={`/${slug}`}
        onClick={(e) => {
          e.preventDefault()
          // Navegación completa: reinicia el wizard al paso inicial vacío.
          window.location.href = `/${slug}`
        }}
        className="landing-card-link mt-6 inline-block px-6 py-3 text-xs font-bold uppercase tracking-[0.22em]"
      >
        Volver al inicio
      </a>
    </div>
  )
}