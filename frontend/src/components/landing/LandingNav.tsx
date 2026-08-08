"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useActiveSection } from "@/hooks/landing/use-active-section"

const NAV_LINKS = [
  { id: "servicios", label: "Servicios" },
  { id: "equipo", label: "Equipo" },
  { id: "horarios", label: "Horarios" },
  { id: "ubicacion", label: "Ubicación" },
]

interface LandingNavProps {
  slug: string
  shopName: string
}

export function LandingNav({ slug, shopName }: LandingNavProps) {
  const active = useActiveSection(NAV_LINKS.map((link) => link.id))
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <nav
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ background: "var(--landing-bg)", borderColor: "var(--landing-surface)" }}
    >
      {/* Hilo de progreso de scroll (barber-pole, uso 2) */}
      <div
        className="landing-pole h-[3px] w-full origin-left"
        style={{ transform: `scaleX(${progress})`, opacity: progress > 0.01 ? 1 : 0 }}
      />
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${slug}`} className="group flex items-center gap-2.5">
          <span className="landing-pole block h-5 w-1.5" aria-hidden />
          <span
            className="text-xs font-semibold uppercase tracking-[0.2em]"
            style={{ color: "var(--landing-fg)", fontFamily: "var(--landing-font-mono)" }}
          >
            {shopName}
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.id
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest transition-colors"
                style={{
                  color: isActive ? "var(--landing-accent)" : "var(--landing-muted)",
                  fontFamily: "var(--landing-font-mono)",
                }}
              >
                {isActive && <span className="landing-pole block h-3 w-1" aria-hidden />}
                {link.label}
              </a>
            )
          })}
        </div>

        <Link
          href={`/${slug}/reservar`}
          className="group relative inline-flex items-center gap-2 overflow-hidden px-5 py-2 text-xs font-bold uppercase tracking-widest transition-transform hover:translate-y-[-1px]"
          style={{
            background: "var(--landing-accent)",
            color: "var(--landing-bg)",
            fontFamily: "var(--landing-font-display)",
          }}
        >
          <span
            className="absolute inset-0 translate-x-[-101%] transition-transform duration-300 group-hover:translate-x-0"
            style={{ background: "var(--landing-fg)" }}
            aria-hidden
          />
          <span className="relative">Reservar</span>
        </Link>
      </div>
    </nav>
  )
}