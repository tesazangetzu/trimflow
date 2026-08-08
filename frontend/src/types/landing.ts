/**
 * Configuración de la landing pública por tenant.
 * Espejo de backend/src/modules/landing/landing-config.ts
 *
 * Aplica SOLO a la landing pública (`/[slug]`). No afecta a los dashboards.
 */

export interface LandingPalette {
  asphalt: string
  concrete: string
  smoke: string
  bone: string
  neon: string
  blood: string
}

export interface LandingTypography {
  display: string
  body: string
}

export interface LandingBranding {
  logoUrl: string | null
  heroImageUrl: string | null
}

export interface LandingPresentation {
  tagline: string
  heroTitle: string
  heroSubtitle: string
  tickerItems: string[]
}

export interface LandingSections {
  services: boolean
  barbers: boolean
  schedule: boolean
  location: boolean
  booking: boolean
}

export interface LandingConfig {
  enabled: boolean
  palette: LandingPalette
  typography: LandingTypography
  branding: LandingBranding
  presentation: LandingPresentation
  sections: LandingSections
}

export const LANDING_DEFAULTS: LandingConfig = {
  enabled: true,
  palette: {
    asphalt: "#F4EBDD",
    concrete: "#E6D9C3",
    smoke: "#6E5E52",
    bone: "#2B211C",
    neon: "#6F1E23",
    blood: "#A4161A",
  },
  typography: {
    display: "Marcellus",
    body: "Spectral",
  },
  branding: {
    logoUrl: null,
    heroImageUrl: null,
  },
  presentation: {
    tagline: "BARBERÍA · CLÁSICA",
    heroTitle: "",
    heroSubtitle:
      "Cortes de precisión, barbas definidas y estilo que habla por ti. Reserva tu cita en segundos.",
    tickerItems: ["CORTES", "BARBAS", "ESTILO", "RESERVA"],
  },
  sections: {
    services: true,
    barbers: true,
    schedule: true,
    location: true,
    booking: true,
  },
}

/** Proporciones recomendadas para cada imagen (se muestran en el panel admin). */
export const IMAGE_GUIDES = {
  logo: "Cuadrado 1:1 · máx 512×512px · PNG/SVG con fondo transparente",
  hero: "Panorámico 16:9 · máx 1920×1080px · JPG/WebP",
} as const