import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceService } from './service.service';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException } from '../../../shared/exceptions';

describe('ServiceService', () => {
  let service: ServiceService;
  let serviceRepository: jest.Mocked<Repository<Service>>;

  const mockService = {
    id: 'service-uuid-1',
    name: 'Corte de cabello',
    description: 'Corte clásico con tijera',
    price: 15000,
    durationMinutes: 30,
    branchId: 'branch-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Service;

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
        ServiceService,
        {
          provide: getRepositoryToken(Service),
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

    service = module.get<ServiceService>(ServiceService);
    serviceRepository = module.get(getRepositoryToken(Service));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateServiceDto = {
      name: 'Corte de cabello',
      description: 'Corte clásico con tijera',
      price: 15000,
      durationMinutes: 30,
      branchId: 'branch-uuid-1',
    };

    it('should create a service', async () => {
      serviceRepository.create.mockReturnValue(mockService);
      serviceRepository.save.mockResolvedValue(mockService);

      const result = await service.create(dto);

      expect(serviceRepository.create).toHaveBeenCalledWith(dto);
      expect(serviceRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockService);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all services', async () => {
      serviceRepository.find.mockResolvedValue([mockService]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter by branchId', async () => {
      serviceRepository.find.mockResolvedValue([mockService]);
      const result = await service.findAll('branch-uuid-1');
      expect(serviceRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-uuid-1' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a service when found', async () => {
      serviceRepository.findOne.mockResolvedValue(mockService);
      const result = await service.findOne('service-uuid-1');
      expect(result).toEqual(mockService);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      serviceRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findByBranch', () => {
    it('should return services for a branch', async () => {
      serviceRepository.find.mockResolvedValue([mockService]);
      const result = await service.findByBranch('branch-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    const dto: UpdateServiceDto = { price: 18000 };

    it('should update a service', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockService);
      const updated = { ...mockService, price: 18000 };
      serviceRepository.save.mockResolvedValue(updated);

      const result = await service.update('service-uuid-1', dto);
      expect(result.price).toBe(18000);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete', async () => {
      serviceRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);
      await service.remove('service-uuid-1');
      expect(serviceRepository.softDelete).toHaveBeenCalledWith('service-uuid-1');
    });
  });
});
