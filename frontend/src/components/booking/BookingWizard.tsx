"use client"

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { usePublicData } from "@/hooks/booking/use-public-data"
import { useBooking, type BookingStep, type WizardService } from "@/hooks/booking/use-booking"
import { useAvailability } from "@/hooks/booking/use-availability"
import { SelectService } from "@/components/booking/steps/SelectService"
import { SelectBarber } from "@/components/booking/steps/SelectBarber"
import { SelectDate } from "@/components/booking/steps/SelectDate"
import { Checkout } from "@/components/booking/steps/Checkout"
import { Success } from "@/components/booking/steps/Success"
import { BookingStepSummary, BookingStepSummaryContent } from "@/components/booking/BookingStepSummary"
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

// Orden completo de pasos (incluye `success`). Se usa para distinguir la
// dirección de la transición: hacia adelante (next) → morph form→card; hacia
// atrás (editar/prev) → el card sale lanzado hacia abajo y aparece el step.
const STEP_ORDER = ["service", "barber", "date", "checkout", "success"]

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
  // "carcasa" que monta el form completo del paso a su altura natural y reduce su
  // altura hasta el alto del card resumen (morph form→card). Se limpia con un
  // timeout ≥ duración de la reducción.
  const [leavingStep, setLeavingStep] = useState<string | null>(null)
  const prevStepRef = useRef<string | null>(null)

  // Dirección de la transición de salida: "morph" (hacia adelante, el form se
  // reduce hasta convertirse en el card) o "exit" (hacia atrás/editar, el card
  // sale lanzado hacia abajo y al fondo y luego aparece el step).
  const [leavingMode, setLeavingMode] = useState<"morph" | "exit" | null>(null)

  // Alturas medidas (offsetHeight) de la carcasa: el form completo del paso que
  // sale (formHeight) y el card resumen (cardHeight). `shrinking` dispara la
  // reducción de altura + cross-fade form→resumen.
  const [morph, setMorph] = useState<{
    formHeight: number
    cardHeight: number
    shrinking: boolean
  } | null>(null)
  const formRef = useRef<HTMLDivElement>(null)
  const summaryRef = useRef<HTMLDivElement>(null)
  const morphRafRef = useRef<number | null>(null)

  // true cuando el form se monta por un cambio de paso (no en el montaje
  // inicial): retarda la entrada del siguiente paso hasta que la salida del
  // anterior haya terminado.
  const [isStepTransition, setIsStepTransition] = useState(false)

  // Mide las alturas tras montar la carcasa y dispara la reducción: primero
  // fija la altura al form (sin transición, es la altura natural) y en el frame
  // siguiente la reduce hasta el alto del card (ahí sí transiciona).
  useLayoutEffect(() => {
    if (!leavingStep || leavingMode !== "morph") return
    const formEl = formRef.current
    const summaryEl = summaryRef.current
    if (!formEl || !summaryEl) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const formHeight = formEl.offsetHeight
    const cardHeight = summaryEl.offsetHeight

    const run = () => {
      morphRafRef.current = requestAnimationFrame(() => {
        setMorph({ formHeight, cardHeight, shrinking: false })
        morphRafRef.current = requestAnimationFrame(() => {
          setMorph((m) => (m ? { ...m, shrinking: true } : m))
        })
      })
    }
    run()

    return () => {
      if (morphRafRef.current) cancelAnimationFrame(morphRafRef.current)
    }
  }, [leavingStep, leavingMode])

  useEffect(() => {
    const prev = prevStepRef.current
    prevStepRef.current = booking.step
    if (prev && prev !== booking.step && (EDITABLE_STEPS as readonly string[]).includes(prev)) {
      setLeavingStep(prev)
      const prevIndex = STEP_ORDER.indexOf(prev)
      const currIndex = STEP_ORDER.indexOf(booking.step)
      setLeavingMode(currIndex > prevIndex ? "morph" : "exit")
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      const t = setTimeout(() => {
        setLeavingStep(null)
        setLeavingMode(null)
        setMorph(null)
      }, reduced ? 0 : 600)
      return () => clearTimeout(t)
    }
  }, [booking.step])

  // Mantiene el retardo del form durante toda su entrada retardada (delay 0.75s
  // + duración 0.5s), desactivándose después de que la animación concluya.
  useEffect(() => {
    if (!isStepTransition) return
    const t = setTimeout(() => setIsStepTransition(false), 1300)
    return () => clearTimeout(t)
  }, [isStepTransition])

  // Setea el retardo de forma síncrona ANTES de cambiar de paso, para que el
  // form del paso activo (remontado por key={booking.step}) ya tenga la clase
  // de retardo en su primer render.
  const handleNext = () => {
    setIsStepTransition(true)
    booking.nextStep()
  }
  const handlePrev = () => {
    setIsStepTransition(true)
    booking.prevStep()
  }
  const handleSetStep = (step: (typeof EDITABLE_STEPS)[number]) => {
    setIsStepTransition(true)
    booking.setStep(step)
  }

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

  // Resumen compacto de un paso editable según las selecciones actuales.
  // Devuelve null cuando el paso no tiene datos que mostrar (o no es editable).
  const buildSummary = (
    step: (typeof EDITABLE_STEPS)[number],
  ): { label: string; value: string; meta?: string } | null => {
    if (step === "service" && booking.selectedService) {
      return {
        label: STEP_LABELS[step],
        value: booking.selectedService.name,
        meta: formatPrice(booking.selectedService.price),
      }
    }
    if (step === "barber" && booking.selectedBarber) {
      return { label: STEP_LABELS[step], value: booking.selectedBarber.name }
    }
    if (step === "date" && booking.selectedDate && booking.selectedSlot) {
      return {
        label: STEP_LABELS[step],
        value: `${formatDate(booking.selectedDate)} · ${booking.selectedSlot} hs`,
      }
    }
    return null
  }

  const summaries: Array<{
    step: (typeof EDITABLE_STEPS)[number]
    label: string
    value: string
    meta?: string
  }> = []
  for (const s of EDITABLE_STEPS) {
    if (EDITABLE_STEPS.indexOf(s) >= activeEditableIndex) continue
    // Evita duplicación durante el morph: el paso que sale ya se muestra en la
    // carcasa; su card apilada aparece al desmontar (handoff sin salto).
    if (leavingStep && s === leavingStep) continue
    const summary = buildSummary(s)
    if (summary) summaries.push({ step: s, ...summary })
  }

  // Resumen compacto del paso que está transformándose en card dentro de la
  // carcasa de salida (capa superior del cross-fade form→resumen).
  const leavingSummary = leavingStep
    ? buildSummary(leavingStep as (typeof EDITABLE_STEPS)[number])
    : null

  const renderStepContent = (step: BookingStep) => {
    switch (step) {
      case "service":
        return (
          <SelectService
            services={services}
            selectedService={booking.selectedService}
            canProceed={booking.canProceed}
            onSelect={booking.handleSelectService}
            onNext={handleNext}
          />
        )

      case "barber":
        return (
          <SelectBarber
            barbers={barbers}
            selectedBarber={booking.selectedBarber}
            canProceed={booking.canProceed}
            onSelect={booking.handleSelectBarber}
            onPrev={handlePrev}
            onNext={handleNext}
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
            onPrev={handlePrev}
            onNext={handleNext}
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
            onPrev={handlePrev}
            onSubmit={booking.handleSubmit}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <header className="mb-8 text-center">
        {resolvedShop.landing?.branding?.logoUrl ? (
          <img
            src={resolvedShop.landing.branding.logoUrl}
            alt={`Logo de ${resolvedShop.name}`}
            className="mx-auto mb-4 h-14 w-auto max-w-[180px] object-contain"
          />
        ) : (
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl ring-1 ring-primary/30">
            💈
          </div>
        )}
        <p className="landing-eyebrow mb-2">Reserva tu cita</p>
        <h1
          className="text-2xl uppercase"
          style={{
            fontFamily: "var(--landing-font-display)",
            letterSpacing: "0.04em",
            color: "var(--landing-fg)",
          }}
        >
          {resolvedShop.name}
        </h1>
        {activeBranch?.address && (
          <p
            className="mt-2 text-xs"
            style={{
              fontFamily: "var(--landing-font-mono)",
              letterSpacing: "0.08em",
              color: "var(--landing-muted)",
            }}
          >
            {activeBranch.address}
          </p>
        )}
      </header>

      {resolvedShop.branches.length > 1 && (
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          {resolvedShop.branches.map((branch) => (
            <button
              key={branch.id}
              type="button"
              onClick={() => setActiveBranchId(branch.id)}
              className={cn("wiz-chip", activeBranch?.id === branch.id && "is-selected")}
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
              <span className="wiz-step-kicker">{STEP_LABELS[booking.step]}</span>
            )}
            <span
              className="text-xs"
              style={{
                fontFamily: "var(--landing-font-mono)",
                letterSpacing: "0.12em",
                color: "var(--landing-muted)",
              }}
            >
              Paso {stepIndex + 1} / 5
            </span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {["service", "barber", "date", "checkout", "success"].map((s, i) => (
              <div
                key={s}
                className={cn("wiz-progress-segment", i <= stepIndex && "is-done")}
              />
            ))}
          </div>
        </div>
      )}

      {booking.step === "success" ? (
        <div className="wiz-card p-6">
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
          {summaries.map((s) => (
            <BookingStepSummary
              key={s.step}
              label={s.label}
              value={s.value}
              meta={s.meta}
              onClick={() => handleSetStep(s.step)}
            />
          ))}

          {leavingStep && leavingMode === "morph" && (
            <div
              aria-hidden
              className={cn(
                "landing-wizard-morph wiz-card overflow-hidden",
                morph?.shrinking && "is-shrinking",
              )}
              style={
                morph
                  ? { height: morph.shrinking ? morph.cardHeight : morph.formHeight }
                  : undefined
              }
            >
              <div ref={formRef} className="landing-wizard-morph__form p-6">
                {renderStepContent(leavingStep as BookingStep)}
              </div>
              <div
                ref={summaryRef}
                className="landing-wizard-morph__summary flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                {leavingSummary ? (
                  <BookingStepSummaryContent {...leavingSummary} />
                ) : (
                  <div />
                )}
              </div>
            </div>
          )}

          {leavingStep && leavingMode === "exit" && (
            <div aria-hidden className="landing-wizard-form-exit wiz-card p-4">
              {leavingSummary ? (
                <BookingStepSummaryContent {...leavingSummary} />
              ) : (
                <div />
              )}
            </div>
          )}

          <div
            key={booking.step}
            className={cn(
              "landing-wizard-form wiz-card p-6",
              isStepTransition && "landing-wizard-form--delayed",
            )}
          >
            {renderStepContent(booking.step)}
          </div>
        </div>
      )}
    </div>
  )
}