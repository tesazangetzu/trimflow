"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { createAppointment, lookupCustomer } from "@/services/public.service"
import type {
  PublicAppointmentPayload,
  AppointmentResult,
  PublicBarber,
} from "@/types/public"

export interface WizardService {
  id: string
  name: string
  description: string | null
  price: number
  durationMinutes: number
  branchId: string
}

export type BookingStep = "service" | "barber" | "date" | "checkout" | "success"

const STEPS: BookingStep[] = ["service", "barber", "date", "checkout", "success"]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function useBooking(slug: string) {
  const [step, setStepState] = useState<BookingStep>("service")
  const [selectedService, setSelectedService] = useState<WizardService | null>(null)
  const [selectedBarber, setSelectedBarber] = useState<PublicBarber | null>(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedSlot, setSelectedSlot] = useState("")

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [appointment, setAppointment] = useState<AppointmentResult | null>(null)
  const [lookupLoading, setLookupLoading] = useState(false)

  const lookupTimer = useRef<number | null>(null)

  const setStep = useCallback((next: BookingStep) => {
    setStepState(next)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  const nextStep = useCallback(() => {
    const idx = STEPS.indexOf(step)
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1])
  }, [step, setStep])

  const prevStep = useCallback(() => {
    const idx = STEPS.indexOf(step)
    if (idx > 0) setStep(STEPS[idx - 1])
  }, [step, setStep])

  const canProceed = (() => {
    switch (step) {
      case "service":
        return !!selectedService
      case "barber":
        return !!selectedBarber
      case "date":
        return !!selectedDate && !!selectedSlot
      case "checkout":
        return (
          name.trim().length >= 2 &&
          !!email.trim() &&
          EMAIL_RE.test(email.trim()) &&
          !submitting
        )
      default:
        return false
    }
  })()

  const handleSelectService = useCallback((service: WizardService) => {
    setSelectedService(service)
    setSelectedBarber(null)
    setSelectedDate("")
    setSelectedSlot("")
  }, [])

  const handleSelectBarber = useCallback((barber: PublicBarber) => {
    setSelectedBarber(barber)
    setSelectedDate("")
    setSelectedSlot("")
  }, [])

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date)
    setSelectedSlot("")
  }, [])

  const handleSelectSlot = useCallback((slot: string) => {
    setSelectedSlot(slot)
    setError(null)
  }, [])

  // Autocompletado por email (debounce ~400ms) contra el lookup público.
  useEffect(() => {
    if (lookupTimer.current) window.clearTimeout(lookupTimer.current)
    const emailValue = email.trim()
    if (!EMAIL_RE.test(emailValue)) return

    lookupTimer.current = window.setTimeout(async () => {
      setLookupLoading(true)
      try {
        const result = await lookupCustomer(slug, emailValue)
        if (result) {
          if (!name.trim()) setName(result.name ?? "")
          if (!phone.trim()) setPhone(result.phone ?? "")
        }
      } catch {
        // 404 → cliente nuevo: no autocompletar, no es un error
      } finally {
        setLookupLoading(false)
      }
    }, 400)

    return () => {
      if (lookupTimer.current) window.clearTimeout(lookupTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, email])

  const handleSubmit = useCallback(async () => {
    if (submitting || !selectedService || !selectedBarber || !selectedDate || !selectedSlot) {
      return
    }
    if (!name.trim() || !EMAIL_RE.test(email.trim())) {
      setError("Completa tu nombre y un email válido para confirmar.")
      return
    }

    setSubmitting(true)
    setError(null)

    const isoStartTime = new Date(`${selectedDate}T${selectedSlot}`).toISOString()

    const payload: PublicAppointmentPayload = {
      serviceId: selectedService.id,
      barberId: selectedBarber.id,
      startTime: isoStartTime,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
    }

    try {
      const result = await createAppointment(slug, payload)
      setAppointment(result)
      setStep("success")
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status
      if (status === 422 || status === 409) {
        setError("Ese horario acaba de ser tomado. Elige otro disponible.")
      } else {
        setError("No se pudo confirmar la reserva. Inténtalo de nuevo.")
      }
    } finally {
      setSubmitting(false)
    }
  }, [submitting, selectedService, selectedBarber, selectedDate, selectedSlot, name, email, phone, slug, setStep])

  return {
    step,
    setStep,
    nextStep,
    prevStep,
    canProceed,
    error,
    setError,
    submitting,
    appointment,
    selectedService,
    selectedBarber,
    selectedDate,
    selectedSlot,
    handleSelectService,
    handleSelectBarber,
    handleSelectDate,
    handleSelectSlot,
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    lookupLoading,
    handleSubmit,
  }
}