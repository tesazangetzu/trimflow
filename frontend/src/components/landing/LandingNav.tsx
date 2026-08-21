"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"
import { useActiveSection } from "@/hooks/landing/use-active-section"
import { CTA_LABEL } from "@/components/landing/landing-text"
import { smoothScrollToSection, smoothScrollToTop } from "@/lib/smooth-scroll"

const NAV_LINKS = [
  { id: "servicios", label: "Servicios" },
  { id: "equipo", label: "Equipo" },
  { id: "horarios", label: "Horarios" },
  { id: "ubicacion", label: "Ubicación" },
]

interface LandingNavProps {
  slug: string
  shopName: string
  logoUrl?: string | null
}

export function LandingNav({ slug, shopName, logoUrl }: LandingNavProps) {
  const active = useActiveSection(NAV_LINKS.map((link) => link.id))
  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
      setScrolled(window.scrollY > 40)
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

  const close = () => setOpen(false)

  const pathname = usePathname()
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === `/${slug}`) {
      e.preventDefault()
      smoothScrollToTop()
    }
    close()
  }

  return (
    <nav
      className={`landing-nav sticky top-0 z-40 border-b ${open ? "is-open" : ""} ${scrolled ? "is-scrolled" : ""}`}
    >
      {/* Hilo de progreso de scroll (motivo dorado) */}
      <div
        className="landing-pole h-[3px] w-full origin-left"
        style={{ transform: `scaleX(${progress})`, opacity: progress > 0.01 ? 1 : 0 }}
      />
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={`/${slug}`} className="group flex items-center gap-2.5" onClick={handleLogoClick}>
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`Logo de ${shopName}`}
              className="h-7 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <span className="landing-pole block h-5 w-1.5" aria-hidden />
          )}
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
                onClick={(e) => {
                  e.preventDefault()
                  smoothScrollToSection(link.id)
                }}
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

        <div className="flex items-center gap-3">
          <Link
            href={`/${slug}/reservar`}
            className="group relative hidden items-center gap-2 overflow-hidden px-5 py-2 text-xs font-bold uppercase tracking-widest transition-transform hover:translate-y-[-1px] sm:inline-flex"
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
            <span className="relative">{CTA_LABEL}</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="landing-mobile-menu"
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            className="md:hidden"
            style={{ color: "var(--landing-fg)" }}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </div>

      {/* Panel móvil (<md) */}
      <div id="landing-mobile-menu" className="landing-nav-panel md:hidden">
        <div className="mx-auto max-w-6xl space-y-1 px-4 pb-4 sm:px-6">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.id
            return (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  smoothScrollToSection(link.id)
                  setOpen(false)
                }}
                className="flex items-center gap-2 py-2 text-sm font-medium uppercase tracking-widest transition-colors"
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
          <div className="pt-2">
            <Link
              href={`/${slug}/reservar`}
              onClick={() => setOpen(false)}
              className="flex items-center justify-center px-5 py-3 text-xs font-bold uppercase tracking-widest"
              style={{
                background: "var(--landing-accent)",
                color: "var(--landing-bg)",
                fontFamily: "var(--landing-font-display)",
              }}
            >
              {CTA_LABEL}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}