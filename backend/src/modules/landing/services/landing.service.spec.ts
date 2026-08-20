import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { LandingService } from './landing.service';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException } from '../../../shared/exceptions';

describe('LandingService', () => {
  let service: LandingService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const baseTenant = {
    id: 'tenant-1',
    name: 'Barbería Test',
    slug: 'test',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Tenant;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LandingService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: { findOne: jest.fn(), save: jest.fn() },
        },
        { provide: TrimflowLoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<LandingService>(LandingService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
  });

  describe('setBrandingImageUrl', () => {
    it('should persist the logo URL in settings.landing.branding.logoUrl', async () => {
      const tenant = { ...baseTenant };
      tenantRepository.findOne.mockResolvedValue(tenant);
      tenantRepository.save.mockImplementation(async (t: Tenant) => t);

      const result = await service.setBrandingImageUrl('tenant-1', 'logoUrl', 'https://img/logo.png');

      expect(result.branding.logoUrl).toBe('https://img/logo.png');
      expect(tenantRepository.save).toHaveBeenCalled();
      const saved = tenantRepository.save.mock.calls[0][0] as Tenant;
      expect(saved.settings!.landing.branding.logoUrl).toBe('https://img/logo.png');
    });

    it('should persist the hero URL without overwriting an existing logo', async () => {
      const tenant = {
        ...baseTenant,
        settings: {
          landing: {
            branding: { logoUrl: 'https://img/logo.png', heroImageUrl: null },
          },
        },
      } as Tenant;
      tenantRepository.findOne.mockResolvedValue(tenant);
      tenantRepository.save.mockImplementation(async (t: Tenant) => t);

      const result = await service.setBrandingImageUrl('tenant-1', 'heroImageUrl', 'https://img/hero.jpg');

      expect(result.branding.heroImageUrl).toBe('https://img/hero.jpg');
      expect(result.branding.logoUrl).toBe('https://img/logo.png');
      const saved = tenantRepository.save.mock.calls[0][0] as Tenant;
      expect(saved.settings!.landing.branding.heroImageUrl).toBe('https://img/hero.jpg');
      expect(saved.settings!.landing.branding.logoUrl).toBe('https://img/logo.png');
    });

    it('should throw EntityNotFoundException when tenant does not exist', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(
        service.setBrandingImageUrl('missing', 'logoUrl', 'https://img/logo.png'),
      ).rejects.toThrow(EntityNotFoundException);
      expect(tenantRepository.save).not.toHaveBeenCalled();
    });
  });
});