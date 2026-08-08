"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import type { CSSProperties } from "react"
import { Scissors } from "lucide-react"
import type { LandingConfig } from "@/types/landing"

interface LandingHeroProps {
  slug: string
  shopName: string
  config: LandingConfig
  hasHeroImage: boolean
}

export function LandingHero({ slug, shopName, config, hasHeroImage }: LandingHeroProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const { presentation, branding } = config
  const title = presentation.heroTitle?.trim() || shopName
  const ticker = presentation.tickerItems?.length
    ? presentation.tickerItems
    : ["CORTES", "BARBAS", "ESTILO", "RESERVA"]

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const id = requestAnimationFrame(() => bodyRef.current?.classList.add("is-ready"))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <header
      className="landing-hero relative overflow-hidden"
      style={{ background: "var(--landing-hero-bg, #14100E)" }}
    >
      {/* Imagen de fondo (opcional): velada detrás de la banda tinta */}
      {hasHeroImage && branding.heroImageUrl && (
        <div className="pointer-events-none absolute inset-0">
          <img
            src={branding.heroImageUrl}
            alt=""
            className="h-full w-full object-cover opacity-40"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = "none"
            }}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, #14100E 0%, rgba(20,16,14,0.55) 55%, var(--landing-hero-bg, #14100E) 100%)" }}
          />
        </div>
      )}

      <div
        ref={bodyRef}
        className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20"
        style={{
          "--landing-fg": "var(--landing-hero-fg, #F3EBDD)",
          "--landing-muted": "var(--landing-hero-muted, #B9AB97)",
        } as CSSProperties}
      >
        {/* Tagline stamp */}
        <div className="landing-hero-block flex items-center gap-3" style={{ animationDelay: "0ms" }}>
          <Scissors className="size-5" style={{ color: "var(--landing-accent)" }} />
          <span
            className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]"
            style={{
              border: "1px solid var(--landing-accent)",
              color: "var(--landing-fg)",
              fontFamily: "var(--landing-font-mono)",
            }}
          >
            {presentation.tagline || "BARBERÍA"}
          </span>
        </div>

        {/* Logo */}
        {branding.logoUrl && (
          <div className="landing-hero-block mb-6 mt-6" style={{ animationDelay: "80ms" }}>
            <img
              src={branding.logoUrl}
              alt={`Logo de ${shopName}`}
              className="h-20 w-20 object-contain"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.display = "none"
              }}
            />
          </div>
        )}

        {/* Nombre gigante en tinta clara sobre banda oscura */}
        <h1
          className="landing-hero-block max-w-4xl text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
          style={{
            animationDelay: "160ms",
            fontFamily: "var(--landing-font-display)",
            color: "var(--landing-fg)",
          }}
        >
          {title}
        </h1>

        <p
          className="landing-hero-block mt-6 max-w-xl text-base sm:text-lg"
          style={{
            animationDelay: "240ms",
            color: "var(--landing-muted)",
            fontFamily: "var(--landing-font-body)",
          }}
        >
          {presentation.heroSubtitle}
        </p>

        <Link
          href={`/${slug}/reservar`}
          className="landing-hero-block mt-8 inline-flex items-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-widest transition-transform hover:translate-y-[-2px]"
          style={{
            animationDelay: "320ms",
            background: "var(--landing-accent)",
            color: "var(--landing-bg)",
            fontFamily: "var(--landing-font-display)",
            boxShadow: "6px 6px 0 0 var(--landing-hero-bg, #14100E), 6px 6px 0 2px var(--landing-accent)",
          }}
        >
          Reservar ahora
        </Link>
      </div>

      {/* Marquesina: banda tinta, letras tan, separadores caret oxblood */}
      <div
        className="landing-hero-block relative overflow-hidden border-t py-3"
        style={{
          animationDelay: "400ms",
          borderColor: "var(--landing-accent)",
          background: "var(--landing-hero-bg, #14100E)",
        }}
      >
        <div className="flex w-max animate-[landing-marquee_28s_linear_infinite] gap-8 whitespace-nowrap">
          {[...ticker, ...ticker, ...ticker].map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-8 text-sm font-semibold uppercase tracking-[0.3em]"
              style={{ color: "var(--landing-surface)", fontFamily: "var(--landing-font-mono)" }}
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