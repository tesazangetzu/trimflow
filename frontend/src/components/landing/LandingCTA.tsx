"use client"

import Link from "next/link"
import { Reveal } from "@/components/landing/Reveal"
import { CTA_LABEL } from "@/components/landing/landing-text"

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
        <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <p
            className="landing-eyebrow mb-4"
            style={{ color: "var(--landing-muted)" }}
          >
            {shopName} · Reserva
          </p>
          <h2 className="landing-title">¿LISTO PARA TU PRÓXIMO CORTE?</h2>
          <p
            className="mx-auto mt-5 max-w-xl text-base"
            style={{ color: "var(--landing-muted)", fontFamily: "var(--landing-font-body)" }}
          >
            Elige servicio, barbero y hora. Confirmación inmediata, sin llamadas ni esperas.
          </p>
          <Link
            href={`/${slug}/reservar`}
            className="group relative mt-10 inline-flex items-center gap-3 overflow-hidden px-10 py-4 text-sm font-bold uppercase tracking-widest transition-transform hover:translate-y-[-2px]"
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
            <span className="relative">{CTA_LABEL}</span>
            <span className="relative" aria-hidden>
              ›
            </span>
          </Link>
        </div>
      </Reveal>

      {/* Escuadra inferior (motivo dorado, uso 3) */}
      <div className="landing-pole h-[6px] w-full" aria-hidden />
    </section>
  )
}