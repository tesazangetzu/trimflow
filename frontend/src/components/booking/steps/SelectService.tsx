"use client"

import { Button } from "@/components/ui/button"
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
      <h2 className="text-lg font-semibold text-foreground mb-1">Elige un servicio</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Selecciona lo que quieres agendar.
      </p>

      <div className="flex flex-col gap-3">
        {services.map((service) => {
          const selected = selectedService?.id === service.id
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onSelect(service)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-medium text-foreground">{service.name}</h3>
                  {service.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {service.description}
                    </p>
                  )}
                  <span className="mt-2 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {service.durationMinutes} min
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-base font-semibold text-foreground">
                    {formatPrice(service.price)}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-6">
        <Button className="w-full py-3.5" disabled={!canProceed} onClick={onNext}>
          Continuar
        </Button>
      </div>
    </div>
  )
}