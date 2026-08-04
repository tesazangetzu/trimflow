import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BarberService } from './barber.service';
import { Barber } from '../entities/barber.entity';
import { CreateBarberDto } from '../dto/create-barber.dto';
import { UpdateBarberDto } from '../dto/update-barber.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException } from '../../../shared/exceptions';

describe('BarberService', () => {
  let service: BarberService;
  let barberRepository: jest.Mocked<Repository<Barber>>;

  const mockBarber = {
    id: 'barber-uuid-1',
    name: 'Juan Pérez',
    email: 'juan@barberia.com',
    phone: '+56912345678',
    branchId: 'branch-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Barber;

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
        BarberService,
        {
          provide: getRepositoryToken(Barber),
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

    service = module.get<BarberService>(BarberService);
    barberRepository = module.get(getRepositoryToken(Barber));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateBarberDto = {
      name: 'Juan Pérez',
      email: 'juan@barberia.com',
      phone: '+56912345678',
      branchId: 'branch-uuid-1',
    };

    it('should create a barber', async () => {
      barberRepository.create.mockReturnValue(mockBarber);
      barberRepository.save.mockResolvedValue(mockBarber);

      const result = await service.create(dto);

      expect(barberRepository.create).toHaveBeenCalledWith(dto);
      expect(barberRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockBarber);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all barbers', async () => {
      barberRepository.find.mockResolvedValue([mockBarber]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter by branchId', async () => {
      barberRepository.find.mockResolvedValue([mockBarber]);
      const result = await service.findAll('branch-uuid-1');
      expect(barberRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { branchId: 'branch-uuid-1' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a barber when found', async () => {
      barberRepository.findOne.mockResolvedValue(mockBarber);
      const result = await service.findOne('barber-uuid-1');
      expect(result).toEqual(mockBarber);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      barberRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findByBranch', () => {
    it('should return barbers for a branch', async () => {
      barberRepository.find.mockResolvedValue([mockBarber]);
      const result = await service.findByBranch('branch-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    const dto: UpdateBarberDto = { name: 'Juan Actualizado' };

    it('should update a barber', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBarber);
      const updated = { ...mockBarber, name: 'Juan Actualizado' };
      barberRepository.save.mockResolvedValue(updated);

      const result = await service.update('barber-uuid-1', dto);

      expect(result.name).toBe('Juan Actualizado');
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete', async () => {
      barberRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);
      await service.remove('barber-uuid-1');
      expect(barberRepository.softDelete).toHaveBeenCalledWith('barber-uuid-1');
    });
  });
});
