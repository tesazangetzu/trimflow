"use client"

import { useEffect, useState } from "react"

/**
 * Resalta la sección activa de la landing mientras se hace scroll.
 * El id activo se usa para pintar el indicador barber-pole del nav.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string>("")

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id)
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    )

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [ids])

  return active
}