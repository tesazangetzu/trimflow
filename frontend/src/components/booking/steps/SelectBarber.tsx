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
      <p className="wiz-step-kicker mb-2">Nuestros barberos</p>
      <h2 className="wiz-step-title mb-1">Elige tu barbero</h2>
      <p className="wiz-step-sub mb-6">Selecciona a tu profesional favorito.</p>

      <div className="flex flex-col gap-3">
        {barbers.length === 0 ? (
          <p className="wiz-card wiz-step-sub p-4">
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
                className={cn("wiz-option flex items-center gap-4 p-4", selected && "is-selected")}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center border text-xl"
                  style={{
                    borderColor: "color-mix(in srgb, var(--landing-accent) 35%, transparent)",
                    color: "var(--landing-accent)",
                    fontFamily: "var(--landing-font-display)",
                  }}
                  aria-hidden
                >
                  {barber.name.charAt(0)}
                </div>
                <div>
                  <h3 className="wiz-option-title">{barber.name}</h3>
                  <span className="wiz-option-meta">Barbero</span>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" className="wiz-btn wiz-btn-secondary flex-1" onClick={onPrev}>
          Atrás
        </button>
        <button
          type="button"
          className="wiz-btn wiz-btn-primary flex-1"
          disabled={!canProceed}
          onClick={onNext}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}