import type { CSSProperties } from "react"
import type { LandingConfig } from "@/types/landing"

/**
 * Genera las CSS variables de la landing con scope local (se inyectan en el
 * wrapper de `/[slug]`). NO tocan el tema global de los dashboards.
 */
export function landingThemeVars(config: LandingConfig): CSSProperties {
  return {
    "--landing-bg": config.palette.asphalt,
    "--landing-surface": config.palette.concrete,
    "--landing-muted": config.palette.smoke,
    "--landing-fg": config.palette.bone,
    "--landing-accent": config.palette.neon,
    "--landing-danger": config.palette.blood,
    "--landing-font-display": fontFamily(config.typography.display),
    "--landing-font-body": fontFamily(config.typography.body),
  } as CSSProperties
}

/** Mapea el nombre de fuente elegido a la variable de next/font cargada. */
function fontFamily(name: string): string {
  const n = name.trim().toLowerCase()
  if (n.includes("archivo")) return "var(--font-archivo), sans-serif"
  if (n.includes("space grotesk") || n.includes("space_grotesk")) {
    return "var(--font-space-grotesk), sans-serif"
  }
  if (n.includes("poppins")) return "var(--font-poppins), sans-serif"
  // Fuente personalizada no cargada: fallback genérico
  return `'${name}', system-ui, sans-serif`
}