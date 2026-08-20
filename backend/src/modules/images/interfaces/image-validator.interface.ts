import { ImageTarget } from '../constants/image-policy';

/** Token de inyección del validador de imágenes. */
export const IMAGE_VALIDATOR = Symbol('ImageValidatorInterface');

/** Resultado de la validación de un buffer de imagen. */
export interface ImageValidationResult {
  /** Formato real detectado por sharp (p.ej. `png`, `jpeg`, `webp`). */
  format: string;
  /** Ancho en píxeles. */
  width: number;
  /** Alto en píxeles. */
  height: number;
  /** Buffer ya normalizado (p.ej. redimensionado si excedía el máximo). */
  buffer: Buffer;
  /** `true` si el buffer fue redimensionado durante la validación. */
  resized: boolean;
}

/** Servicio de validación/normalización de imágenes (sharp). */
export interface ImageValidatorInterface {
  /**
   * Valida el MIME/extension y las proporciones del buffer según el target,
   * y redimensiona si excede las dimensiones máximas.
   * Lanza `ValidationError` si el tipo o la proporción no son válidos.
   */
  validate(
    buffer: Buffer,
    options: { mimetype: string; originalname: string; target: ImageTarget },
  ): Promise<ImageValidationResult>;
}