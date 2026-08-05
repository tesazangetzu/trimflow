"use client"

import { Button } from "@/components/ui/button"
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
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-3xl ring-1 ring-emerald-500/30">
        ✓
      </div>
      <h2 className="text-xl font-semibold text-foreground">¡Reserva confirmada!</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        Te esperamos en {shopName} el horario que elegiste.
      </p>

      <div className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl border border-border bg-card p-5 text-left text-sm shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Reserva #{appointment.id.slice(0, 8)}
        </p>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Día</span>
          <span className="font-medium capitalize text-foreground">{formatDate(selectedDate)}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-muted-foreground">Hora</span>
          <span className="font-medium text-foreground">{selectedSlot} hs</span>
        </div>
        {branch && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Sucursal</span>
            <span className="font-medium text-foreground">{branch.name}</span>
          </div>
        )}
        {branch?.address && (
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Dirección</span>
            <span className="font-medium text-foreground">{branch.address}</span>
          </div>
        )}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Enviaremos la confirmación al email indicado.
      </p>

      <a
        href={`/${slug}`}
        onClick={(e) => {
          e.preventDefault()
          // Navegación completa: reinicia el wizard al paso inicial vacío.
          window.location.href = `/${slug}`
        }}
        className="mt-6 inline-block"
      >
        <Button variant="outline">Volver al inicio</Button>
      </a>
    </div>
  )
}