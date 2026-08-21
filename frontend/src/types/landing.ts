/**
 * Configuración de la landing pública por tenant.
 * Espejo de backend/src/modules/landing/landing-config.ts
 *
 * Aplica SOLO a la landing pública (`/[slug]`). No afecta a los dashboards.
 *
 * Los defaults por defecto de serie son «dark luxury» (ADR-015): negro carbón
 * (asphalt/concrete) + texto marfil (bone) + dorado old-gold (neon).
 * Los tenants con configuración guardada conservan su paleta hasta
 * «Restaurar default» en el panel admin.
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
    asphalt: "#0A0A0A",
    concrete: "#111111",
    smoke: "#8A8178",
    bone: "#F2EDE4",
    neon: "#C9A227",
    blood: "#C0392B",
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
    heroTitle: "EL CORTE QUE TE DEFINE.",
    heroSubtitle:
      "Técnica clásica, actitud moderna. Cada corte una decisión de estilo.",
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
  logo: "Cuadrado 1:1 · máx 512×512px · PNG/JPG/WebP",
  hero: "Panorámico 16:9 · máx 1920×1080px · JPG/WebP",
} as const