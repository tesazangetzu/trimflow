"use client"

interface BookingStepSummaryProps {
  label: string
  value: string
  meta?: string
  onClick: () => void
}

/**
 * Card compacta de resumen para un paso ya completado del wizard de reserva.
 * Al hacer click re-expande el form de ese paso (setStep). Usa los tokens
 * shadcn que WIZARD_TOKENS mapea a la paleta de la landing.
 */
/**
 * Contenido compartido de la card compacta de resumen (label, value, meta y
 * etiqueta "Editar"), sin el `button` que lo envuelve en `BookingStepSummary`.
 * Reutilizable fuera de un botón (p. ej. en la carcasa que colapsa durante el
 * morph form→card del wizard).
 */
export function BookingStepSummaryContent({
  label,
  value,
  meta,
}: {
  label: string
  value: string
  meta?: string
}) {
  return (
    <>
      <div className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="mt-0.5 block truncate font-medium text-foreground">{value}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta && <span className="text-sm font-semibold text-primary">{meta}</span>}
        <span className="text-xs text-muted-foreground transition-transform group-hover:-translate-x-0.5">
          Editar
        </span>
      </div>
    </>
  )
}

export function BookingStepSummary({ label, value, meta, onClick }: BookingStepSummaryProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <BookingStepSummaryContent label={label} value={value} meta={meta} />
    </button>
  )
}