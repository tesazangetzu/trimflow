import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrimflowLoggerService } from '../../../shared/logger';
import { ImagesService } from '../services/images.service';
import { R2StorageInterface, R2_STORAGE } from '../interfaces/r2-storage.interface';
import { ImageValidatorInterface, IMAGE_VALIDATOR } from '../interfaces/image-validator.interface';
import { ValidationError } from '../../../shared/exceptions';

describe('ImagesService', () => {
  let service: ImagesService;
  let r2Storage: jest.Mocked<R2StorageInterface>;
  let imageValidator: jest.Mocked<ImageValidatorInterface>;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn((key: string) => {
      const values: Record<string, string> = {
        R2_PUBLIC_URL: 'https://images.trimflow.com',
        R2_ACCOUNT_ID: 'account-123',
      };
      return values[key];
    }),
  };

  const validBuffer = Buffer.from('image-bytes');

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImagesService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: TrimflowLoggerService, useValue: mockLogger },
        {
          provide: R2_STORAGE,
          useValue: { upload: jest.fn() },
        },
        {
          provide: IMAGE_VALIDATOR,
          useValue: { validate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ImagesService>(ImagesService);
    r2Storage = module.get(R2_STORAGE);
    imageValidator = module.get(IMAGE_VALIDATOR);
  });

  describe('uploadImage', () => {
    it('should validate, upload and return the public URL', async () => {
      imageValidator.validate.mockResolvedValue({
        format: 'image/png',
        width: 256,
        height: 256,
        buffer: validBuffer,
        resized: false,
      });
      r2Storage.upload.mockResolvedValue({ key: 'tenant-1/logo/some-uuid.png' });

      const result = await service.uploadImage({
        buffer: validBuffer,
        mimetype: 'image/png',
        originalname: 'logo.png',
        target: 'logo',
        tenantId: 'tenant-1',
      });

      expect(imageValidator.validate).toHaveBeenCalledWith(validBuffer, {
        mimetype: 'image/png',
        originalname: 'logo.png',
        target: 'logo',
      });
      expect(r2Storage.upload).toHaveBeenCalledWith({
        key: expect.stringMatching(/^tenant-1\/logo\/[0-9a-f-]{36}\.png$/),
        body: validBuffer,
        contentType: 'image/png',
      });
      expect(result.url).toBe('https://images.trimflow.com/tenant-1/logo/some-uuid.png');
      expect(result.key).toBe('tenant-1/logo/some-uuid.png');
      expect(result.mimeType).toBe('image/png');
      expect(result.width).toBe(256);
      expect(result.height).toBe(256);
    });

    it('should propagate validation errors without uploading', async () => {
      imageValidator.validate.mockRejectedValue(new ValidationError('Proporción inválida'));

      await expect(
        service.uploadImage({
          buffer: validBuffer,
          mimetype: 'image/gif',
          originalname: 'x.gif',
          target: 'hero',
          tenantId: 'tenant-1',
        }),
      ).rejects.toThrow(ValidationError);

      expect(r2Storage.upload).not.toHaveBeenCalled();
    });

    it('should propagate storage errors', async () => {
      imageValidator.validate.mockResolvedValue({
        format: 'image/jpeg',
        width: 1920,
        height: 1080,
        buffer: validBuffer,
        resized: false,
      });
      r2Storage.upload.mockRejectedValue(new Error('R2 failure'));

      await expect(
        service.uploadImage({
          buffer: validBuffer,
          mimetype: 'image/jpeg',
          originalname: 'hero.jpg',
          target: 'hero',
          tenantId: 'tenant-1',
        }),
      ).rejects.toThrow('R2 failure');
    });

    it('should derive public URL from account id when R2_PUBLIC_URL is empty', async () => {
      // Instancia fresca con un mock que NO define R2_PUBLIC_URL (solo account id),
      // para ejercitar el fallback de URL derivada en el constructor del servicio.
      const fallbackConfig = {
        get: jest.fn((key: string) => (key === 'R2_ACCOUNT_ID' ? 'account-123' : undefined)),
      };
      const fallbackModule: TestingModule = await Test.createTestingModule({
        providers: [
          ImagesService,
          { provide: ConfigService, useValue: fallbackConfig },
          { provide: TrimflowLoggerService, useValue: mockLogger },
          { provide: R2_STORAGE, useValue: { upload: jest.fn() } },
          { provide: IMAGE_VALIDATOR, useValue: { validate: jest.fn() } },
        ],
      }).compile();

      const fallbackService = fallbackModule.get<ImagesService>(ImagesService);
      const fallbackR2 = fallbackModule.get(R2_STORAGE);
      const fallbackValidator = fallbackModule.get(IMAGE_VALIDATOR);

      fallbackValidator.validate.mockResolvedValue({
        format: 'image/png',
        width: 100,
        height: 100,
        buffer: validBuffer,
        resized: false,
      });
      fallbackR2.upload.mockResolvedValue({ key: 'tenant-1/logo/u.png' });

      const result = await fallbackService.uploadImage({
        buffer: validBuffer,
        mimetype: 'image/png',
        originalname: 'logo.png',
        target: 'logo',
        tenantId: 'tenant-1',
      });

      expect(result.url).toBe('https://account-123.r2.cloudflarestorage.com/tenant-1/logo/u.png');
    });
  });
});