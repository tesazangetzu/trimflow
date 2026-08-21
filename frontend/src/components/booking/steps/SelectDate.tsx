"use client"

import { cn } from "@/lib/utils"
import { todayInShop, addDays } from "@/lib/timezone"
import type { PublicSlot } from "@/types/public"

interface SelectDateProps {
  selectedDate: string
  selectedSlot: string
  slots: PublicSlot[]
  slotsLoading: boolean
  slotsError: string | null
  canProceed: boolean
  onSelectDate: (date: string) => void
  onSelectSlot: (slot: string) => void
  onPrev: () => void
  onNext: () => void
}

const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

interface DayOption {
  dateStr: string
  dayName: string
  dayNum: string
}

function getNext7Days(): DayOption[] {
  const days: DayOption[] = []
  const today = todayInShop()
  for (let i = 0; i < 7; i++) {
    const dateStr = addDays(today, i)
    const [y, m, d] = dateStr.split("-").map(Number)
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    days.push({
      dateStr,
      dayName: WEEKDAYS[weekday],
      dayNum: String(d),
    })
  }
  return days
}

function splitSlots(slots: PublicSlot[]) {
  const morning = slots.filter((s) => Number(s.startTime.slice(0, 2)) < 12)
  const afternoon = slots.filter((s) => Number(s.startTime.slice(0, 2)) >= 12)
  return { morning, afternoon }
}

export function SelectDate({
  selectedDate,
  selectedSlot,
  slots,
  slotsLoading,
  slotsError,
  canProceed,
  onSelectDate,
  onSelectSlot,
  onPrev,
  onNext,
}: SelectDateProps) {
  const days = getNext7Days()
  const { morning, afternoon } = splitSlots(slots)

  return (
    <div>
      <p className="wiz-step-kicker mb-2">Agenda</p>
      <h2 className="wiz-step-title mb-1">Fecha y hora</h2>
      <p className="wiz-step-sub mb-6">Elige el día y el horario disponible que prefieras.</p>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const selected = selectedDate === day.dateStr
          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              className={cn("wiz-day", selected && "is-selected")}
            >
              <span className="wiz-day-name">{day.dayName}</span>
              <span className="wiz-day-num">{day.dayNum}</span>
            </button>
          )
        })}
      </div>

      {selectedDate ? (
        <div className="mt-6">
          <h3 className="wiz-group-label mb-3">Horarios disponibles</h3>

          {slotsLoading ? (
            <div
              className="animate-pulse py-8 text-center text-xs"
              style={{ fontFamily: "var(--landing-font-mono)", color: "var(--landing-muted)" }}
            >
              Cargando horarios libres…
            </div>
          ) : slotsError ? (
            <div
              className="border p-4 py-8 text-center text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--landing-danger) 40%, transparent)",
                background: "color-mix(in srgb, var(--landing-danger) 7%, transparent)",
                color: "var(--landing-danger)",
                fontFamily: "var(--landing-font-mono)",
              }}
            >
              {slotsError}
            </div>
          ) : slots.length > 0 ? (
            <div className="space-y-6">
              {morning.length > 0 && (
                <div>
                  <h4 className="wiz-group-label mb-3">Mañana</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {morning.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        selected={selectedSlot === slot.startTime}
                        onSelect={onSelectSlot}
                      />
                    ))}
                  </div>
                </div>
              )}
              {afternoon.length > 0 && (
                <div>
                  <h4 className="wiz-group-label mb-3">Tarde</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {afternoon.map((slot) => (
                      <SlotButton
                        key={slot.startTime}
                        slot={slot}
                        selected={selectedSlot === slot.startTime}
                        onSelect={onSelectSlot}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="wiz-card wiz-step-sub p-4 py-8 text-center text-xs">
              Sin horarios disponibles para este día. Elige otra fecha.
            </div>
          )}
        </div>
      ) : (
        <div className="wiz-card wiz-step-sub mt-6 p-4 py-10 text-center text-xs">
          Selecciona un día para ver las horas disponibles.
        </div>
      )}

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

function SlotButton({
  slot,
  selected,
  onSelect,
}: {
  slot: PublicSlot
  selected: boolean
  onSelect: (slot: string) => void
}) {
  if (slot.past) {
    return (
      <span aria-disabled="true" className="wiz-slot block">
        {slot.startTime}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(slot.startTime)}
      aria-pressed={selected}
      className={cn("wiz-slot", selected && "is-selected")}
    >
      {slot.startTime}
    </button>
  )
}