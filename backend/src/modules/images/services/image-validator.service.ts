import { Injectable } from '@nestjs/common';
import sharp, { Metadata } from 'sharp';
import { TrimflowLoggerService } from '../../../shared/logger';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  IMAGE_TARGET_POLICIES,
  RATIO_TOLERANCE,
  ImageTarget,
} from '../constants/image-policy';
import { ValidationError } from '../../../shared/exceptions';
import { ImageValidatorInterface, ImageValidationResult } from '../interfaces/image-validator.interface';

@Injectable()
export class ImageValidatorService implements ImageValidatorInterface {
  constructor(private logger: TrimflowLoggerService) {
    this.logger.setContext('ImageValidatorService');
  }

  async validate(
    buffer: Buffer,
    options: { mimetype: string; originalname: string; target: ImageTarget },
  ): Promise<ImageValidationResult> {
    this.assertMimeType(options.mimetype);
    this.assertExtension(options.originalname);

    let metadata: Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new ValidationError('El archivo no es una imagen válida');
    }

    const format = metadata.format;
    const width = metadata.width ?? 0;
    const height = metadata.height ?? 0;

    if (!width || !height) {
      throw new ValidationError('No se pudieron leer las dimensiones de la imagen');
    }

    // Re-verificación del formato real detectado por sharp (evita spoofing de MIME).
    const detectedMime = this.mimeFromFormat(format);
    if (!detectedMime || !ALLOWED_MIME_TYPES.includes(detectedMime as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new ValidationError(`Formato de imagen no permitido: ${format ?? 'desconocido'} (png, jpg, webp)`);
    }

    const policy = IMAGE_TARGET_POLICIES[options.target];
    this.assertRatio(width, height, policy.ratio, options.target);

    const needsResize = width > policy.maxWidth || height > policy.maxHeight;
    let finalBuffer = buffer;
    let finalWidth = width;
    let finalHeight = height;

    if (needsResize) {
      finalBuffer = await sharp(buffer)
        .resize({ width: policy.maxWidth, height: policy.maxHeight, fit: 'inside', withoutEnlargement: true })
        .toBuffer();
      const resizedMeta = await sharp(finalBuffer).metadata();
      finalWidth = resizedMeta.width ?? width;
      finalHeight = resizedMeta.height ?? height;
      this.logger.log(
        `Imagen redimensionada para target ${options.target}: ${width}x${height} -> ${finalWidth}x${finalHeight}`,
      );
    }

    return {
      format: detectedMime,
      width: finalWidth,
      height: finalHeight,
      buffer: finalBuffer,
      resized: needsResize,
    };
  }

  private assertMimeType(mimetype: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new ValidationError('Tipo de archivo no permitido (png, jpg, webp)');
    }
  }

  private assertExtension(originalname: string): void {
    const ext = this.extensionOf(originalname);
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
      throw new ValidationError('Extensión de archivo no permitida (png, jpg, jpeg, webp)');
    }
  }

  private extensionOf(filename: string): string | undefined {
    const idx = filename.lastIndexOf('.');
    return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : undefined;
  }

  private mimeFromFormat(format: string | undefined): string | undefined {
    switch (format) {
      case 'png':
        return 'image/png';
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      default:
        return undefined;
    }
  }

  private assertRatio(width: number, height: number, targetRatio: number, target: ImageTarget): void {
    if (width <= 0 || height <= 0) return;
    const actual = width / height;
    const min = targetRatio * (1 - RATIO_TOLERANCE);
    const max = targetRatio * (1 + RATIO_TOLERANCE);
    if (actual < min || actual > max) {
      throw new ValidationError(
        `Proporción de imagen inválida para ${target} (${actual.toFixed(2)}). Se espera ${targetRatio.toFixed(2)} ±${RATIO_TOLERANCE * 100}%.`,
      );
    }
  }
}