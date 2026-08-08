import type { ReactNode } from "react"

interface LandingStateProps {
  state: "loading" | "notFound" | "error"
  error?: string | null
  onRetry?: () => void
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 text-center"
      style={{ background: "var(--landing-bg, #0A0A0A)" }}
    >
      {children}
    </div>
  )
}

export function LandingState({ state, error, onRetry }: LandingStateProps) {
  if (state === "loading") {
    return (
      <Frame>
        <div className="animate-pulse text-center">
          <div
            className="mx-auto mb-4 h-3 w-40"
            style={{ background: "var(--landing-surface, #111111)" }}
          />
          <div className="h-12 w-64" style={{ background: "var(--landing-surface, #111111)" }} />
        </div>
      </Frame>
    )
  }

  if (state === "notFound") {
    return (
      <Frame>
        <div>
          <p
            className="text-sm font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--landing-accent, #C9A227)", fontFamily: "var(--landing-font-mono, monospace)" }}
          >
            404
          </p>
          <h1
            className="mt-2 text-3xl font-bold uppercase tracking-tight"
style={{ color: "var(--landing-fg, #F2EDE4)", fontFamily: "var(--landing-font-display, serif)" }}
          >
            Barbería no encontrada
          </h1>
          <p
            className="mx-auto mt-3 max-w-sm text-sm"
style={{ color: "var(--landing-muted, #8A8178)", fontFamily: "var(--landing-font-body, serif)" }}
          >
            No encontramos una barbería con esa dirección. Verifica el enlace o vuelve a intentarlo.
          </p>
        </div>
      </Frame>
    )
  }

  return (
    <Frame>
      <div>
        <h1
          className="text-2xl font-bold uppercase tracking-tight"
          style={{ color: "var(--landing-fg, #F2EDE4)", fontFamily: "var(--landing-font-display, serif)" }}
        >
          Algo salió mal
        </h1>
        <p
          className="mx-auto mt-2 max-w-sm text-sm"
          style={{ color: "var(--landing-muted, #8A8178)", fontFamily: "var(--landing-font-body, serif)" }}
        >
          {error ?? "No se pudo cargar la barbería."}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-6 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-transform hover:translate-y-[-1px]"
            style={{ background: "var(--landing-accent, #C9A227)", color: "var(--landing-bg, #0A0A0A)", fontFamily: "var(--landing-font-display, serif)" }}
          >
            Reintentar
          </button>
        )}
      </div>
    </Frame>
  )
}
