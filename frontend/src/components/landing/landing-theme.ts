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
    "--landing-font-mono": "var(--font-plex-mono), monospace",
    "--landing-hero-bg": "#14100E",
    "--landing-hero-fg": "#F3EBDD",
    "--landing-hero-muted": "#B9AB97",
  } as CSSProperties
}

/** Mapea el nombre de fuente elegido a la variable de next/font cargada. */
function fontFamily(name: string): string {
  const n = name.trim().toLowerCase()
  if (n.includes("marcellus")) return "var(--font-marcellus), serif"
  if (n.includes("spectral")) return "var(--font-spectral), serif"
  if (n.includes("poppins")) return "var(--font-poppins), sans-serif"
  // Fuente personalizada no cargada: fallback genérico
  return `'${name}', system-ui, sans-serif`
}