"use client"

import { usePublicData } from "@/hooks/booking/use-public-data"
import { BookingWizard } from "@/components/booking/BookingWizard"
import { LandingHero } from "@/components/landing/LandingHero"
import { LandingSections } from "@/components/landing/LandingSections"
import { landingThemeVars } from "@/components/landing/landing-theme"
import { LANDING_DEFAULTS, type LandingConfig } from "@/types/landing"

export function LandingPage({ slug }: { slug: string }) {
  const { shop, loading, notFound, error, reload } = usePublicData(slug)

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--landing-bg, #16181A)" }}
      >
        <div className="animate-pulse text-center">
          <div className="mx-auto mb-4 h-3 w-40 border-2 border-[#FFB300]" />
          <div className="h-12 w-64 bg-[#232629]" />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 text-center"
        style={{ background: "var(--landing-bg, #16181A)" }}
      >
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#FFB300]">404</p>
          <h1 className="mt-2 text-3xl font-black uppercase text-[#F2EFE9]">Barbería no encontrada</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm text-[#9AA0A6]">
            No encontramos una barbería con esa dirección. Verifica el enlace o vuelve a intentarlo.
          </p>
        </div>
      </div>
    )
  }

  if (error || !shop) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4 text-center"
        style={{ background: "var(--landing-bg, #16181A)" }}
      >
        <div>
          <h1 className="text-2xl font-black uppercase text-[#F2EFE9]">Algo salió mal</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-[#9AA0A6]">
            {error ?? "No se pudo cargar la barbería."}
          </p>
          <button
            onClick={reload}
            className="mt-6 px-6 py-3 text-sm font-black uppercase tracking-widest"
            style={{ background: "#FFB300", color: "#16181A" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const config: LandingConfig = shop.landing ?? LANDING_DEFAULTS

  return (
    <div
      style={{ ...landingThemeVars(config), background: "var(--landing-bg)" }}
      className="min-h-screen"
    >
      <LandingHero
        shopName={shop.name}
        config={config}
        hasHeroImage={Boolean(config.branding.heroImageUrl)}
      />

      <LandingSections shop={shop} config={config} />

      {config.sections.booking && (
        <section id="reservar" className="border-b-2 border-[var(--landing-surface)]">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
            <p
              className="mb-2 text-xs font-bold uppercase tracking-[0.25em]"
              style={{ color: "var(--landing-accent)", fontFamily: "var(--landing-font-display)" }}
            >
              RESERVA
            </p>
            <h2
              className="text-3xl font-black uppercase tracking-tight sm:text-4xl"
              style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-display)" }}
            >
              Tu cita en segundos
            </h2>
            <div className="mt-8">
              <BookingWizard slug={slug} shop={shop} />
            </div>
          </div>
        </section>
      )}

      <footer
        className="py-8 text-center text-xs font-semibold uppercase tracking-[0.25em]"
        style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-display)" }}
      >
        <span style={{ color: "var(--landing-accent)" }}>{shop.name}</span> · Powered by TrimFlow
      </footer>
    </div>
  )
}
