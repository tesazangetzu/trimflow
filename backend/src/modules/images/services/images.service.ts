import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { TrimflowLoggerService } from '../../../shared/logger';
import { IMAGE_TARGET_POLICIES } from '../constants/image-policy';
import { R2StorageInterface, R2_STORAGE } from '../interfaces/r2-storage.interface';
import {
  ImageValidatorInterface,
  IMAGE_VALIDATOR,
} from '../interfaces/image-validator.interface';
import {
  ImagesServiceInterface,
  UploadImageParams,
  UploadImageResult,
} from '../interfaces/images-service.interface';

@Injectable()
export class ImagesService implements ImagesServiceInterface {
  private readonly publicUrl: string;

  constructor(
    @Inject(R2_STORAGE) private r2Storage: R2StorageInterface,
    @Inject(IMAGE_VALIDATOR) private imageValidator: ImageValidatorInterface,
    private configService: ConfigService,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('ImagesService');
    this.publicUrl = (this.configService.get<string>('R2_PUBLIC_URL') ?? '').replace(/\/+$/, '');
  }

  async uploadImage(params: UploadImageParams): Promise<UploadImageResult> {
    // 1. Validar tipo + proporción (y redimensionar si excede el máximo).
    const validation = await this.imageValidator.validate(params.buffer, {
      mimetype: params.mimetype,
      originalname: params.originalname,
      target: params.target,
    });

    // 2. Generar key única: <tenantId>/<target>/<uuid>.<ext>
    const policy = IMAGE_TARGET_POLICIES[params.target];
    const key = `${params.tenantId}/${params.target}/${randomUUID()}.${policy.extension}`;

    // 3. Subir a R2.
    const { key: storedKey } = await this.r2Storage.upload({
      key,
      body: validation.buffer,
      contentType: validation.format,
    });

    // 4. Construir URL pública.
    const url = this.buildPublicUrl(storedKey);

    this.logger.log(`Imagen subida: ${storedKey} (${validation.width}x${validation.height})`);

    return {
      url,
      key: storedKey,
      mimeType: validation.format,
      size: validation.buffer.byteLength,
      width: validation.width,
      height: validation.height,
    };
  }

  private buildPublicUrl(key: string): string {
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    // Fallback defensivo: URL derivada del account id.
    const accountId = this.configService.get<string>('R2_ACCOUNT_ID') ?? 'account';
    return `https://${accountId}.r2.cloudflarestorage.com/${key}`;
  }
}