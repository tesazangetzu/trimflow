"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePublicData } from "@/hooks/booking/use-public-data"
import { useBooking, type BookingStep, type WizardService } from "@/hooks/booking/use-booking"
import { useAvailability } from "@/hooks/booking/use-availability"
import { SelectService } from "@/components/booking/steps/SelectService"
import { SelectBarber } from "@/components/booking/steps/SelectBarber"
import { SelectDate } from "@/components/booking/steps/SelectDate"
import { Checkout } from "@/components/booking/steps/Checkout"
import { Success } from "@/components/booking/steps/Success"
import { BookingStepSummary } from "@/components/booking/BookingStepSummary"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { PublicBranch, PublicShop } from "@/types/public"

const STEP_LABELS: Record<string, string> = {
  service: "Servicio",
  barber: "Barbero",
  date: "Fecha y hora",
  checkout: "Tus datos",
  success: "Confirmación",
}

// Orden editable del wizard (excluye `success`, que es pantalla final).
const EDITABLE_STEPS = ["service", "barber", "date", "checkout"] as const

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

export function BookingWizard({ slug, shop: shopProp }: { slug: string; shop?: PublicShop }) {
  const { shop, loading, notFound, error, reload } = usePublicData(slug)
  const resolvedShop = shopProp ?? shop
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null)

  const booking = useBooking(slug)

  // Paso editable que acaba de abandonarse: mientras esté activo, se muestra una
  // "carcasa" con el chrome de la card que colapsa (morph form→card) antes de
  // aparecer el resumen apilado del paso. Se limpia con un timeout ≥ duración.
  const [leavingStep, setLeavingStep] = useState<string | null>(null)
  const prevStepRef = useRef<string | null>(null)

  // Dispara la clase `is-closing` tras el montaje de la carcasa para que el
  // colapso por grid-rows arranque desde la altura real del contenido.
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!leavingStep) return
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setClosing(true)),
    )
    return () => cancelAnimationFrame(raf)
  }, [leavingStep])

  useEffect(() => {
    const prev = prevStepRef.current
    prevStepRef.current = booking.step
    if (prev && prev !== booking.step && (EDITABLE_STEPS as readonly string[]).includes(prev)) {
      setLeavingStep(prev)
      const t = setTimeout(() => {
        setLeavingStep(null)
        setClosing(false)
      }, 300)
      return () => clearTimeout(t)
    }
  }, [booking.step])

  const activeBranch: PublicBranch | null = useMemo(() => {
    if (!resolvedShop || resolvedShop.branches.length === 0) return null
    const found = resolvedShop.branches.find((b) => b.id === activeBranchId)
    return found ?? resolvedShop.branches[0]
  }, [resolvedShop, activeBranchId])

  const services: WizardService[] = useMemo(() => {
    if (!activeBranch) return []
    return activeBranch.services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      price: s.price,
      durationMinutes: s.durationMinutes,
      branchId: activeBranch.id,
    }))
  }, [activeBranch])

  const barbers = activeBranch?.barbers ?? []

  const availability = useAvailability(
    slug,
    booking.selectedService?.id ?? null,
    booking.selectedBarber?.id ?? null,
    booking.selectedDate,
  )

  if (!shopProp && loading) {
    return (
      <div className="mx-auto max-w-xl animate-pulse space-y-4 py-10">
        <div className="h-8 w-2/3 rounded bg-muted" />
        <div className="h-40 rounded-2xl bg-muted" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted text-3xl">
          💈
        </div>
        <h1 className="text-xl font-semibold text-foreground">Barbería no encontrada</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          No encontramos una barbería con esa dirección. Verifica el enlace o vuelve a intentarlo.
        </p>
        <a href="/login" className="mt-6 inline-block">
          <Button variant="outline">Ir al inicio</Button>
        </a>
      </div>
    )
  }

  if (!resolvedShop || (!shopProp && error)) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-xl font-semibold text-foreground">Algo salió mal</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {error ?? "No se pudo cargar la barbería."}
        </p>
        <Button className="mt-6" onClick={reload}>
          Reintentar
        </Button>
      </div>
    )
  }

  const stepIndex = ["service", "barber", "date", "checkout", "success"].indexOf(booking.step)

  // Cards resumen: pasos completados anteriores al activo se compactan a resumen
  // y quedan apilados arriba. El paso activo se muestra expandido (form) debajo.
  const activeEditableIndex = EDITABLE_STEPS.indexOf(
    booking.step as (typeof EDITABLE_STEPS)[number],
  )
  const summaries: Array<{
    step: (typeof EDITABLE_STEPS)[number]
    label: string
    value: string
    meta?: string
  }> = []
  for (const s of EDITABLE_STEPS) {
    if (EDITABLE_STEPS.indexOf(s) >= activeEditableIndex) continue
    if (s === "service" && booking.selectedService) {
      summaries.push({
        step: s,
        label: STEP_LABELS[s],
        value: booking.selectedService.name,
        meta: formatPrice(booking.selectedService.price),
      })
    } else if (s === "barber" && booking.selectedBarber) {
      summaries.push({ step: s, label: STEP_LABELS[s], value: booking.selectedBarber.name })
    } else if (s === "date" && booking.selectedDate && booking.selectedSlot) {
      summaries.push({
        step: s,
        label: STEP_LABELS[s],
        value: `${formatDate(booking.selectedDate)} · ${booking.selectedSlot} hs`,
      })
    }
  }

  const renderStepContent = (step: BookingStep) => {
    switch (step) {
      case "service":
        return (
          <SelectService
            services={services}
            selectedService={booking.selectedService}
            canProceed={booking.canProceed}
            onSelect={booking.handleSelectService}
            onNext={booking.nextStep}
          />
        )

      case "barber":
        return (
          <SelectBarber
            barbers={barbers}
            selectedBarber={booking.selectedBarber}
            canProceed={booking.canProceed}
            onSelect={booking.handleSelectBarber}
            onPrev={booking.prevStep}
            onNext={booking.nextStep}
          />
        )

      case "date":
        return (
          <SelectDate
            selectedDate={booking.selectedDate}
            selectedSlot={booking.selectedSlot}
            slots={availability.slots}
            slotsLoading={availability.loading}
            slotsError={availability.error}
            canProceed={booking.canProceed}
            onSelectDate={booking.handleSelectDate}
            onSelectSlot={booking.handleSelectSlot}
            onPrev={booking.prevStep}
            onNext={booking.nextStep}
          />
        )

      case "checkout":
        return (
          <Checkout
            selectedService={booking.selectedService!}
            selectedBarber={booking.selectedBarber!}
            selectedDate={booking.selectedDate}
            selectedSlot={booking.selectedSlot}
            name={booking.name}
            phone={booking.phone}
            email={booking.email}
            lookupLoading={booking.lookupLoading}
            saveEnabled={booking.canProceed}
            submitting={booking.submitting}
            error={booking.error}
            onNameChange={booking.setName}
            onPhoneChange={booking.setPhone}
            onEmailChange={booking.setEmail}
            onPrev={booking.prevStep}
            onSubmit={booking.handleSubmit}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <header className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl ring-1 ring-primary/30">
          💈
        </div>
        <h1 className="text-2xl font-bold text-foreground">{resolvedShop.name}</h1>
        {activeBranch?.address && (
          <p className="mt-1 text-sm text-muted-foreground">{activeBranch.address}</p>
        )}
      </header>

      {resolvedShop.branches.length > 1 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {resolvedShop.branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => setActiveBranchId(branch.id)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-all",
                activeBranch?.id === branch.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              {branch.name}
            </button>
          ))}
        </div>
      )}

      {booking.step !== "success" && (
        <div className="mb-6">
          <div className="flex items-center justify-between">
            {STEP_LABELS[booking.step] && (
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {STEP_LABELS[booking.step]}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Paso {stepIndex + 1} de 5
            </span>
          </div>
          <div className="mt-2 flex gap-1.5">
            {["service", "barber", "date", "checkout", "success"].map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= stepIndex ? "bg-primary" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {booking.step === "success" ? (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          {booking.appointment && (
            <Success
              appointment={booking.appointment}
              shopName={resolvedShop.name}
              branch={activeBranch}
              selectedDate={booking.selectedDate}
              selectedSlot={booking.selectedSlot}
              slug={slug}
            />
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {leavingStep && (
            <div
              aria-hidden
              className="landing-wizard-form-exit rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className={cn("landing-wizard-collapse", closing && "is-closing")}>
                {renderStepContent(leavingStep as BookingStep)}
              </div>
            </div>
          )}

          {summaries.map((s) => (
            <div key={s.step} className="landing-wizard-summary-in">
              <BookingStepSummary
                label={s.label}
                value={s.value}
                meta={s.meta}
                onClick={() => booking.setStep(s.step)}
              />
            </div>
          ))}

          <div
            key={booking.step}
            className="landing-wizard-form rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            {renderStepContent(booking.step)}
          </div>
        </div>
      )}
    </div>
  )
}