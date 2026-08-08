"use client"

import { useEffect, useRef } from "react"

/**
 * Scroll reveal con IntersectionObserver (fade + rise, ADR-014).
 * Añade la clase `is-visible` la primera vez que el elemento entra en el
 * viewport y deja de observar. Si el usuario prefiere reducir movimiento, o si
 * no hay IntersectionObserver, se muestra directamente sin animación.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion || typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible")
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-visible")
          io.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return ref
}
