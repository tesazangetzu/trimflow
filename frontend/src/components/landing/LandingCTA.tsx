"use client"

import Link from "next/link"
import { Reveal } from "@/components/landing/Reveal"

interface LandingCtaProps {
  slug: string
  shopName: string
}

export function LandingCTA({ slug, shopName }: LandingCtaProps) {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "var(--landing-hero-bg, #0A0A0A)" }}
    >
      <Reveal>
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-[0.3em]"
            style={{
              color: "var(--landing-muted)",
              fontFamily: "var(--landing-font-mono)",
            }}
          >
            {shopName} · Reserva
          </p>
          <h2
            className="text-3xl font-bold uppercase leading-tight tracking-tight sm:text-4xl"
            style={{ color: "var(--landing-hero-fg, #F2EDE4)", fontFamily: "var(--landing-font-display)" }}
          >
            Tu asiento en la silla
          </h2>
          <p
            className="mx-auto mt-4 max-w-xl text-base"
            style={{ color: "var(--landing-hero-muted, #8A8178)", fontFamily: "var(--landing-font-body)" }}
          >
            Elige servicio, barbero y hora. Confirmación inmediata, sin llamadas ni esperas.
          </p>
          <Link
            href={`/${slug}/reservar`}
            className="group relative mt-8 inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-sm font-bold uppercase tracking-widest transition-transform hover:translate-y-[-2px]"
            style={{
              background: "var(--landing-accent)",
              color: "var(--landing-bg)",
              fontFamily: "var(--landing-font-display)",
            }}
          >
            {/* Sweep de relleno */}
            <span
              className="absolute inset-0 translate-x-[-101%] transition-transform duration-300 group-hover:translate-x-0"
              style={{ background: "var(--landing-hero-fg, #F2EDE4)" }}
              aria-hidden
            />
            <span className="relative">Reservar ahora</span>
            <span className="relative" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      </Reveal>

      {/* Escuadra inferior (barber-pole, uso 3) */}
      <div className="landing-pole h-[6px] w-full" aria-hidden />
    </section>
  )
}