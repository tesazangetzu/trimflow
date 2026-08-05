"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PublicBarber } from "@/types/public"

interface SelectBarberProps {
  barbers: PublicBarber[]
  selectedBarber: PublicBarber | null
  canProceed: boolean
  onSelect: (barber: PublicBarber) => void
  onPrev: () => void
  onNext: () => void
}

export function SelectBarber({
  barbers,
  selectedBarber,
  canProceed,
  onSelect,
  onPrev,
  onNext,
}: SelectBarberProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Elige tu barbero</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Selecciona a tu profesional favorito.
      </p>

      <div className="flex flex-col gap-3">
        {barbers.length === 0 ? (
          <p className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            Esta sucursal aún no tiene barberos asignados.
          </p>
        ) : (
          barbers.map((barber) => {
            const selected = selectedBarber?.id === barber.id
            return (
              <button
                key={barber.id}
                type="button"
                onClick={() => onSelect(barber)}
                className={cn(
                  "flex items-center gap-4 rounded-xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl ring-1 ring-primary/30">
                  💈
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{barber.name}</h3>
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Barbero
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1 py-3.5" onClick={onPrev}>
          Atrás
        </Button>
        <Button className="flex-1 py-3.5" disabled={!canProceed} onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  )
}