import { Test, TestingModule } from '@nestjs/testing';
import sharp from 'sharp';
import { TrimflowLoggerService } from '../../../shared/logger';
import { ImageValidatorService } from '../services/image-validator.service';
import { ValidationError } from '../../../shared/exceptions';

describe('ImageValidatorService', () => {
  let service: ImageValidatorService;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImageValidatorService,
        { provide: TrimflowLoggerService, useValue: mockLogger },
      ],
    }).compile();
    service = module.get<ImageValidatorService>(ImageValidatorService);
  });

  async function makePng(width: number, height: number): Promise<Buffer> {
    return sharp({ create: { width, height, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 1 } } })
      .png()
      .toBuffer();
  }

  describe('validate', () => {
    it('should accept a valid 1:1 logo within limits', async () => {
      const buffer = await makePng(256, 256);
      const result = await service.validate(buffer, {
        mimetype: 'image/png',
        originalname: 'logo.png',
        target: 'logo',
      });

      expect(result.format).toBe('image/png');
      expect(result.width).toBe(256);
      expect(result.height).toBe(256);
      expect(result.resized).toBe(false);
    });

    it('should reject a non-allowed mime type', async () => {
      const buffer = await makePng(256, 256);
      await expect(
        service.validate(buffer, { mimetype: 'image/gif', originalname: 'logo.gif', target: 'logo' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject a non-allowed extension even with valid mime', async () => {
      const buffer = await makePng(256, 256);
      await expect(
        service.validate(buffer, { mimetype: 'image/png', originalname: 'logo.txt', target: 'logo' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject a 16:9 image for logo target (ratio mismatch)', async () => {
      const buffer = await makePng(1920, 1080);
      await expect(
        service.validate(buffer, { mimetype: 'image/png', originalname: 'wide.png', target: 'logo' }),
      ).rejects.toThrow(ValidationError);
    });

    it('should resize an oversized logo while keeping it valid', async () => {
      const buffer = await makePng(1024, 1024);
      const result = await service.validate(buffer, {
        mimetype: 'image/png',
        originalname: 'big-logo.png',
        target: 'logo',
      });

      expect(result.resized).toBe(true);
      expect(result.width).toBeLessThanOrEqual(512);
      expect(result.height).toBeLessThanOrEqual(512);
    });

    it('should accept a valid 16:9 hero image', async () => {
      const buffer = await makePng(1280, 720);
      const result = await service.validate(buffer, {
        mimetype: 'image/png',
        originalname: 'hero.png',
        target: 'hero',
      });

      expect(result.format).toBe('image/png');
      expect(result.width).toBe(1280);
      expect(result.height).toBe(720);
      expect(result.resized).toBe(false);
    });

    it('should reject invalid image buffer', async () => {
      await expect(
        service.validate(Buffer.from('not-an-image'), {
          mimetype: 'image/png',
          originalname: 'x.png',
          target: 'hero',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });
});