/**
 * Configuración de la landing pública por tenant.
 *
 * La configuración se guarda en `Tenant.settings.landing` (JSONB) y se fusiona
 * sobre estos defaults. La estética por defecto es urbana/street.
 *
 * IMPORTANTE: esta configuración aplica SOLO a la landing pública (`/[slug]`).
 * No afecta a los dashboards (admin/barber/super-admin), que conservan su tema.
 */

export interface LandingPalette {
  /** Fondo principal de la landing */
  asphalt: string;
  /** Superficie / tarjetas */
  concrete: string;
  /** Texto secundario */
  smoke: string;
  /** Texto principal */
  bone: string;
  /** Acento / CTA */
  neon: string;
  /** Alerta / destacado */
  blood: string;
}

export interface LandingTypography {
  /** Fuente display (títulos / hero) */
  display: string;
  /** Fuente body (texto) */
  body: string;
}

export interface LandingBranding {
  /** URL del logo. Proporción recomendada: cuadrado 1:1, máx 512x512px */
  logoUrl: string | null;
  /** URL de la imagen del hero. Proporción recomendada: 16:9, máx 1920x1080px */
  heroImageUrl: string | null;
}

export interface LandingPresentation {
  /** Eslogan corto que acompaña al nombre */
  tagline: string;
  /** Título del hero. Vacío => usa el nombre de la barbería */
  heroTitle: string;
  /** Subtítulo del hero */
  heroSubtitle: string;
  /** Items de la marquesina (ticker) */
  tickerItems: string[];
}

export interface LandingSections {
  services: boolean;
  barbers: boolean;
  schedule: boolean;
  location: boolean;
  booking: boolean;
}

export interface LandingConfig {
  enabled: boolean;
  palette: LandingPalette;
  typography: LandingTypography;
  branding: LandingBranding;
  presentation: LandingPresentation;
  sections: LandingSections;
}

export const LANDING_DEFAULTS: LandingConfig = {
  enabled: true,
  palette: {
    asphalt: '#16181A',
    concrete: '#232629',
    smoke: '#9AA0A6',
    bone: '#F2EFE9',
    neon: '#FFB300',
    blood: '#E5484D',
  },
  typography: {
    display: 'Archivo',
    body: 'Space Grotesk',
  },
  branding: {
    logoUrl: null,
    heroImageUrl: null,
  },
  presentation: {
    tagline: 'BARBERÍA · ESTILO URBANO',
    heroTitle: '',
    heroSubtitle:
      'Cortes de precisión, barbas definidas y estilo que habla por ti. Reserva tu cita en segundos.',
    tickerItems: ['CORTES', 'BARBAS', 'ESTILO', 'RESERVA', 'FRESH'],
  },
  sections: {
    services: true,
    barbers: true,
    schedule: true,
    location: true,
    booking: true,
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function mergeObject<T extends Record<string, unknown>>(base: T, override?: unknown): T {
  if (!isRecord(override)) return base;
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(base)) {
    const baseVal = base[key];
    const overrideVal = override[key];
    if (overrideVal === undefined) continue;
    if (isRecord(baseVal) && isRecord(overrideVal)) {
      result[key] = mergeObject(baseVal, overrideVal);
    } else {
      result[key] = overrideVal;
    }
  }
  return result as T;
}

/**
 * Fusiona la configuración guardada (parcial) sobre los defaults.
 * Devuelve siempre una configuración completa y válida.
 */
export function mergeLandingConfig(saved?: unknown): LandingConfig {
  if (!isRecord(saved)) return { ...LANDING_DEFAULTS };
  const merged = mergeObject(LANDING_DEFAULTS as unknown as Record<string, unknown>, saved);
  return merged as unknown as LandingConfig;
}