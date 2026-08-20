/**
 * Política de imágenes para el módulo de imágenes (Cloudflare R2).
 *
 * Define qué tipos de archivo se aceptan, el tamaño máximo y las restricciones
 * de proporción/dimensiones por target de uso (`logo` | `hero`).
 */

export type ImageTarget = 'logo' | 'hero';

export const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Extensiones aceptadas (sin punto), alineadas con ALLOWED_MIME_TYPES. */
export const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'] as const;

/** Tamaño máximo de archivo: 10 MB. */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/** Tolerancia máxima de desviación de la proporción objetivo (±10%). */
export const RATIO_TOLERANCE = 0.1;

export interface ImageTargetPolicy {
  /** Extensión canónica usada en la key almacenada. */
  extension: string;
  /** Proporción objetivo (width / height). */
  ratio: number;
  /** Ancho máximo en píxeles. */
  maxWidth: number;
  /** Alto máximo en píxeles. */
  maxHeight: number;
}

export const IMAGE_TARGET_POLICIES: Record<ImageTarget, ImageTargetPolicy> = {
  logo: {
    extension: 'png',
    ratio: 1,
    maxWidth: 512,
    maxHeight: 512,
  },
  hero: {
    extension: 'jpg',
    ratio: 16 / 9,
    maxWidth: 1920,
    maxHeight: 1080,
  },
};