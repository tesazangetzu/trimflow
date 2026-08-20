import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TrimflowLoggerService } from '../../../shared/logger';
import { R2StorageService } from '../services/r2-storage.service';

const sendMock = jest.fn();
const destroyMock = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  class MockS3Client {
    send = sendMock;
    destroy = destroyMock;
  }
  return {
    S3Client: MockS3Client,
    PutObjectCommand: jest.fn((input: unknown) => ({ __command: 'PutObjectCommand', input })),
  };
});

describe('R2StorageService', () => {
  let service: R2StorageService;

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
        R2_ACCOUNT_ID: 'account-123',
        R2_ACCESS_KEY_ID: 'access-key',
        R2_SECRET_ACCESS_KEY: 'secret-key',
        R2_BUCKET: 'trimflow-images',
      };
      return values[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        R2StorageService,
        { provide: ConfigService, useValue: mockConfig },
        { provide: TrimflowLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<R2StorageService>(R2StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should upload an object and return its key', async () => {
    sendMock.mockResolvedValue({ ETag: '"etag"' });
    const body = Buffer.from('fake-image-bytes');

    const result = await service.upload({ key: 'tenant/logo/uuid.png', body, contentType: 'image/png' });

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ key: 'tenant/logo/uuid.png' });
    expect(mockLogger.log).toHaveBeenCalledWith(expect.stringContaining('tenant/logo/uuid.png'));
  });

  it('should propagate upload errors', async () => {
    sendMock.mockRejectedValue(new Error('S3 failure'));

    await expect(
      service.upload({ key: 'tenant/hero/uuid.jpg', body: Buffer.from('x'), contentType: 'image/jpeg' }),
    ).rejects.toThrow('S3 failure');
  });
});