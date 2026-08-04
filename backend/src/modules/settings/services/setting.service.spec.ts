import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SettingService } from './setting.service';
import { Setting } from '../entities/setting.entity';
import { TrimflowLoggerService } from '../../../shared/logger';

describe('SettingService', () => {
  let service: SettingService;
  let settingRepository: jest.Mocked<Repository<Setting>>;

  const mockSetting = {
    id: 'setting-uuid-1',
    key: 'business_hours',
    value: '09:00-18:00',
    description: 'Horario laboral',
    branchId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Setting;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingService,
        {
          provide: getRepositoryToken(Setting),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: TrimflowLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<SettingService>(SettingService);
    settingRepository = module.get(getRepositoryToken(Setting));
  });

  afterEach(() => jest.clearAllMocks());

  describe('get', () => {
    it('should return the value when setting exists', async () => {
      settingRepository.findOne.mockResolvedValue(mockSetting);

      const result = await service.get('business_hours');

      expect(result).toBe('09:00-18:00');
    });

    it('should return undefined when setting does not exist', async () => {
      settingRepository.findOne.mockResolvedValue(null);

      const result = await service.get('nonexistent');

      expect(result).toBeUndefined();
    });

    it('should filter by branchId when provided', async () => {
      settingRepository.findOne.mockResolvedValue(mockSetting);

      await service.get('business_hours', 'branch-uuid-1');

      expect(settingRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'business_hours', branchId: 'branch-uuid-1' },
      });
    });
  });

  describe('set', () => {
    it('should update existing setting', async () => {
      settingRepository.findOne.mockResolvedValue(mockSetting);
      const updated = { ...mockSetting, value: '08:00-20:00' };
      settingRepository.save.mockResolvedValue(updated);

      const result = await service.set('business_hours', '08:00-20:00');

      expect(result.value).toBe('08:00-20:00');
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should create new setting when not found', async () => {
      settingRepository.findOne.mockResolvedValue(null);
      settingRepository.create.mockReturnValue(mockSetting);
      settingRepository.save.mockResolvedValue(mockSetting);

      const result = await service.set('business_hours', '09:00-18:00', 'branch-uuid-1', 'Horario laboral');

      expect(settingRepository.create).toHaveBeenCalledWith({
        key: 'business_hours',
        value: '09:00-18:00',
        branchId: 'branch-uuid-1',
        description: 'Horario laboral',
      });
      expect(result).toEqual(mockSetting);
    });
  });

  describe('getAll', () => {
    it('should return all settings', async () => {
      settingRepository.find.mockResolvedValue([mockSetting]);

      const result = await service.getAll();

      expect(result).toHaveLength(1);
    });

    it('should filter by branchId', async () => {
      settingRepository.find.mockResolvedValue([mockSetting]);

      await service.getAll('branch-uuid-1');

      expect(settingRepository.find).toHaveBeenCalledWith({
        where: { branchId: 'branch-uuid-1' },
        order: { key: 'ASC' },
      });
    });
  });

  describe('delete', () => {
    it('should soft-delete by key', async () => {
      settingRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.delete('business_hours');

      expect(settingRepository.softDelete).toHaveBeenCalledWith({
        key: 'business_hours',
      });
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should soft-delete by key and branch', async () => {
      settingRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.delete('business_hours', 'branch-uuid-1');

      expect(settingRepository.softDelete).toHaveBeenCalledWith({
        key: 'business_hours',
        branchId: 'branch-uuid-1',
      });
    });
  });
});
