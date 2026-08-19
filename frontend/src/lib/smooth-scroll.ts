"use client"

const NAV_OFFSET = 64

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Ancla a una sección de la landing por id, respetando reduced-motion. */
export function smoothScrollToSection(id: string): void {
  const el = document.getElementById(id)
  if (!el) return
  const y = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
  window.scrollTo({ top: Math.max(0, y), behavior: prefersReducedMotion() ? "auto" : "smooth" })
}

/** Vuelve al top del documento. */
export function smoothScrollToTop(): void {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })
}