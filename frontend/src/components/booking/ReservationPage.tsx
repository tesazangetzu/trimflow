"use client"

import Link from "next/link"
import type { CSSProperties } from "react"
import { ArrowLeft } from "lucide-react"
import { usePublicData } from "@/hooks/booking/use-public-data"
import { BookingWizard } from "@/components/booking/BookingWizard"
import { LandingState } from "@/components/landing/LandingState"
import { landingThemeVars } from "@/components/landing/landing-theme"
import { LANDING_DEFAULTS, type LandingConfig } from "@/types/landing"

/**
 * Mapeo scoped de los tokens shadcn del BookingWizard sobre la paleta de la
 * landing (misma filosofía de aislamiento que ADR-013). Se aplica por CSS
 * variables en el wrapper de `/[slug]/reservar`, sin tocar los dashboards.
 */
const WIZARD_TOKENS = {
  "--background": "var(--landing-bg)",
  "--foreground": "var(--landing-fg)",
  "--card": "var(--landing-surface)",
  "--card-foreground": "var(--landing-fg)",
  "--popover": "var(--landing-surface)",
  "--popover-foreground": "var(--landing-fg)",
  "--primary": "var(--landing-accent)",
  "--primary-foreground": "var(--landing-bg)",
  "--secondary": "var(--landing-surface)",
  "--secondary-foreground": "var(--landing-fg)",
  "--muted": "var(--landing-surface)",
  "--muted-foreground": "var(--landing-muted)",
  "--accent": "var(--landing-surface)",
  "--accent-foreground": "var(--landing-fg)",
  "--border": "color-mix(in srgb, var(--landing-fg) 28%, transparent)",
  "--input": "color-mix(in srgb, var(--landing-fg) 28%, transparent)",
  "--ring": "var(--landing-accent)",
  "--destructive": "var(--landing-danger)",
  "--destructive-foreground": "var(--landing-bg)",
} as CSSProperties

export function ReservationPage({ slug }: { slug: string }) {
  const { shop, loading, notFound, error, reload } = usePublicData(slug)

  if (loading) {
    return <LandingState state="loading" />
  }

  if (notFound) {
    return <LandingState state="notFound" />
  }

  if (error || !shop) {
    return <LandingState state="error" error={error} onRetry={reload} />
  }

  const config: LandingConfig = shop.landing ?? LANDING_DEFAULTS

  return (
    <div
      className="landing-page min-h-screen"
      style={{ ...landingThemeVars(config), background: "var(--landing-bg)" }}
    >
      {/* Cabecera con botón de volver (patrón de referencia) */}
      <header className="border-b" style={{ borderColor: "var(--landing-surface)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href={`/${slug}`}
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest transition-colors"
            style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-mono)" }}
          >
            <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" style={{ color: "var(--landing-accent)" }} />
            Volver a {shop.name}
          </Link>
          <span
            className="text-xs font-semibold uppercase tracking-[0.25em]"
            style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
          >
            Reserva
          </span>
        </div>
      </header>

      {/* Wizard con tokens shadcn mapeados a la paleta de la landing */}
      <div className="mx-auto w-full max-w-3xl px-4 pt-4 pb-16 sm:px-6" style={WIZARD_TOKENS}>
        <BookingWizard slug={slug} shop={shop} />
      </div>
    </div>
  )
}