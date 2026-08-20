import { ImageTarget } from '../constants/image-policy';

/** Token de inyección del servicio de imágenes. */
export const IMAGES_SERVICE = Symbol('ImagesServiceInterface');

/** Parámetros de entrada para subir una imagen. */
export interface UploadImageParams {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  target: ImageTarget;
  tenantId: string;
}

/** Resultado de una subida de imagen: URL pública + metadatos. */
export interface UploadImageResult {
  /** URL pública de la imagen en R2. */
  url: string;
  /** Key del objeto en R2. */
  key: string;
  /** MIME type almacenado. */
  mimeType: string;
  /** Tamaño del archivo (bytes). */
  size: number;
  /** Ancho final en píxeles. */
  width: number;
  /** Alto final en píxeles. */
  height: number;
}

/** Interfaz publicada del servicio de imágenes (ISP). */
export interface ImagesServiceInterface {
  uploadImage(params: UploadImageParams): Promise<UploadImageResult>;
}