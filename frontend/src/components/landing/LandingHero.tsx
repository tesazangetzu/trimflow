"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import type { CSSProperties } from "react"
import { ChevronDown } from "lucide-react"
import type { LandingConfig } from "@/types/landing"
import { LANDING_DEFAULTS } from "@/types/landing"
import { CTA_LABEL } from "@/components/landing/landing-text"

const CTA_SECONDARY = "VER SERVICIOS"

interface LandingHeroProps {
  slug: string
  shopName: string
  config: LandingConfig
  heroTitle: string
  hasHeroImage: boolean
}

export function LandingHero({ slug, shopName, config, heroTitle, hasHeroImage }: LandingHeroProps) {
  const bodyRef = useRef<HTMLElement>(null)
  const [imgError, setImgError] = useState(false)
  const { presentation, branding } = config
  const ticker = presentation.tickerItems?.length
    ? presentation.tickerItems
    : LANDING_DEFAULTS.presentation.tickerItems

  const showHeroImage = hasHeroImage && branding.heroImageUrl && !imgError

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = requestAnimationFrame(() => bodyRef.current?.classList.add("is-ready"))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <header
      ref={bodyRef}
      className="landing-hero relative flex min-h-[100svh] flex-col overflow-hidden"
      style={{ background: "var(--landing-hero-bg, #0A0A0A)" }}
    >
      {/* Imagen de fondo (opcional): full-bleed velada + scrim hacia --landing-bg.
          Si la URL falla al cargar (onError), se oculta y se muestra el fallback. */}
      {showHeroImage && branding.heroImageUrl && (
        <div className="pointer-events-none absolute inset-0">
          <Image
            src={branding.heroImageUrl}
            alt=""
            fill
            unoptimized={true}
            className="object-cover opacity-35"
            sizes="100vw"
            priority
            onError={() => setImgError(true)}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, var(--landing-hero-bg) 0%, rgba(10,10,10,0.55) 50%, var(--landing-hero-bg) 100%)" }}
          />
        </div>
      )}

      {/* Fallback tipográfico/geométrico: hairlines doradas + numeral de índice.
          Sin imagen ni URLs inventadas. */}
      {!showHeroImage && (
        <div className="landing-hero-fallback pointer-events-none absolute inset-0" aria-hidden />
      )}

      <div
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-24 sm:px-6"
        style={{
          "--landing-fg": "var(--landing-hero-fg, #F2EDE4)",
          "--landing-muted": "var(--landing-hero-muted, #8A8178)",
        } as CSSProperties}
      >
        {/* Eyebrow / kicker: tagline mono accent + nombre del shop siempre presente */}
        <div className="landing-hero-block flex flex-col gap-1.5" style={{ animationDelay: "0ms" }}>
          <p className="landing-eyebrow">{presentation.tagline || "BARBERÍA"}</p>
          <p
            className="text-sm uppercase tracking-[0.3em]"
            style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-mono)" }}
          >
            {shopName}
          </p>
        </div>

        {/* Headline display */}
        <h1
          className="landing-title landing-hero-title landing-hero-block mt-6 max-w-4xl uppercase"
          style={{ animationDelay: "120ms" }}
        >
          {heroTitle}
        </h1>

        <p
          className="landing-hero-block mt-6 max-w-xl text-base sm:text-lg"
          style={{
            animationDelay: "200ms",
            color: "var(--landing-muted)",
            fontFamily: "var(--landing-font-body)",
          }}
        >
          {presentation.heroSubtitle}
        </p>

        <div className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href={`/${slug}/reservar`}
            className="landing-hero-block inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest transition-transform hover:translate-y-[-2px]"
            style={{
              animationDelay: "280ms",
              background: "var(--landing-accent)",
              color: "var(--landing-bg)",
              fontFamily: "var(--landing-font-display)",
            }}
          >
            {CTA_LABEL}
          </Link>
          <a
            href="#servicios"
            className="landing-hero-block inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold uppercase tracking-widest transition-colors hover:bg-[var(--landing-accent)]/10"
            style={{
              animationDelay: "360ms",
              border: "1px solid var(--landing-accent)",
              color: "var(--landing-fg)",
              background: "transparent",
              fontFamily: "var(--landing-font-display)",
            }}
          >
            {CTA_SECONDARY}
          </a>
        </div>
      </div>

      {/* Indicador de scroll (se oculta y desactiva con prefers-reduced-motion vía CSS). */}
      <a
        href="#servicios"
        aria-label="Bajar a servicios"
        className="landing-scroll-hint absolute bottom-24 left-1/2 z-10 hidden -translate-x-1/2 sm:flex"
      >
        <ChevronDown className="landing-scroll-chevron size-4" aria-hidden />
      </a>

      {/* Marquesina: franja fina inferior sobria, separadores caret dorados */}
      <div
        className="landing-marquee-band relative overflow-hidden border-t"
        style={{
          borderColor: "color-mix(in srgb, var(--landing-accent) 30%, transparent)",
          background: "var(--landing-hero-bg, #0A0A0A)",
        }}
      >
        <div className="landing-marquee flex w-max gap-8 whitespace-nowrap px-4 py-3 sm:px-6">
          {[...ticker, ...ticker, ...ticker].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 text-xs font-medium uppercase tracking-[0.3em]"
              style={{ color: "var(--landing-hero-muted, #8A8178)", fontFamily: "var(--landing-font-mono)" }}
            >
              {item}
              <span style={{ color: "var(--landing-accent)" }}>›</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  )
}