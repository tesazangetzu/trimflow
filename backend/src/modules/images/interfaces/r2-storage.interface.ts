/** Token de inyección del almacenamiento R2. */
export const R2_STORAGE = Symbol('R2StorageInterface');

/** Contrato del almacenamiento de objetos (Cloudflare R2). */
export interface R2StorageInterface {
  /**
   * Sube un buffer de objeto a R2 bajo la key dada.
   * Devuelve la key almacenada.
   */
  upload(input: {
    key: string;
    body: Buffer;
    contentType: string;
  }): Promise<{ key: string }>;
}