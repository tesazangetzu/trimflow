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
        <span className="wiz-option-meta block">{label}</span>
        <span className="wiz-option-title mt-0.5 block truncate">{value}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta && <span className="wiz-price text-sm font-semibold">{meta}</span>}
        <span
          className="text-xs transition-transform group-hover:-translate-x-0.5"
          style={{ fontFamily: "var(--landing-font-mono)", color: "var(--landing-muted)" }}
        >
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
      className="group wiz-card flex w-full items-center justify-between gap-3 p-4 text-left"
    >
      <BookingStepSummaryContent label={label} value={value} meta={meta} />
    </button>
  )
}