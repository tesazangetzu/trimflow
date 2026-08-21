"use client"

import { cn } from "@/lib/utils"
import type { WizardService } from "@/hooks/booking/use-booking"

interface SelectServiceProps {
  services: WizardService[]
  selectedService: WizardService | null
  canProceed: boolean
  onSelect: (service: WizardService) => void
  onNext: () => void
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

export function SelectService({
  services,
  selectedService,
  canProceed,
  onSelect,
  onNext,
}: SelectServiceProps) {
  return (
    <div>
      <p className="wiz-step-kicker mb-2">Servicios</p>
      <h2 className="wiz-step-title mb-1">Elige tu servicio</h2>
      <p className="wiz-step-sub mb-6">Selecciona lo que quieres agendar.</p>

      <div className="flex flex-col gap-3">
        {services.map((service) => {
          const selected = selectedService?.id === service.id
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={cn("wiz-option p-4", selected && "is-selected")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="wiz-option-title">{service.name}</h3>
                  {service.description && (
                    <p className="wiz-step-sub mt-1 line-clamp-2">{service.description}</p>
                  )}
                  <span className="wiz-option-meta mt-2 inline-block">
                    {service.durationMinutes} min
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="wiz-price text-base font-semibold">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <button
          type="button"
          className="wiz-btn wiz-btn-primary w-full"
          disabled={!canProceed}
          onClick={onNext}
        >
          Continuar
        </button>
      </div>
    </div>
  )
}