"use client"

import { Button } from "@/components/ui/button"
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
      <h2 className="text-lg font-semibold text-foreground mb-1">Fecha y hora</h2>
      <p className="text-sm text-muted-foreground mb-5">
        Elige el día y el horario disponible que prefieras.
      </p>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const selected = selectedDate === day.dateStr
          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => onSelectDate(day.dateStr)}
              className={cn(
                "flex flex-col items-center rounded-lg border py-2.5 transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40",
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {day.dayName}
              </span>
              <span className="text-base font-semibold leading-tight">{day.dayNum}</span>
            </button>
          )
        })}
      </div>

      {selectedDate ? (
        <div className="mt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Horarios disponibles
          </h3>

          {slotsLoading ? (
            <div className="animate-pulse py-8 text-center text-xs text-muted-foreground">
              Cargando horarios libres…
            </div>
          ) : slotsError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 py-8 text-center text-xs text-destructive">
              {slotsError}
            </div>
          ) : slots.length > 0 ? (
            <div className="space-y-6">
              {morning.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Mañana</h4>
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
                  <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Tarde</h4>
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
            <div className="rounded-xl border border-border bg-muted/40 py-8 text-center text-xs text-muted-foreground">
              Sin horarios disponibles para este día. Elige otra fecha.
            </div>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 py-10 text-center text-xs text-muted-foreground">
          Selecciona un día para ver las horas disponibles.
        </div>
      )}

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
      <span
        aria-disabled="true"
        className={cn(
          "cursor-not-allowed rounded-lg border border-border bg-muted/40 py-2.5 text-center text-xs font-medium text-muted-foreground/40 line-through opacity-60",
        )}
      >
        {slot.startTime}
      </span>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(slot.startTime)}
      aria-pressed={selected}
      className={cn(
        "rounded-lg border py-2.5 text-center text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/50",
      )}
    >
      {slot.startTime}
    </button>
  )
}