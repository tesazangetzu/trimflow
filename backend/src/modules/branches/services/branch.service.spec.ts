import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchService } from './branch.service';
import { Branch } from '../entities/branch.entity';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException } from '../../../shared/exceptions';

describe('BranchService', () => {
  let service: BranchService;
  let branchRepository: jest.Mocked<Repository<Branch>>;

  const mockBranch = {
    id: 'branch-uuid-1',
    name: 'Sucursal Centro',
    address: 'Av. Siempre Viva 123',
    phone: '+56912345678',
    openingTime: '09:00',
    closingTime: '18:00',
    tenantId: 'tenant-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Branch;

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
        BranchService,
        {
          provide: getRepositoryToken(Branch),
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

    service = module.get<BranchService>(BranchService);
    branchRepository = module.get(getRepositoryToken(Branch));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateBranchDto = {
      name: 'Sucursal Centro',
      address: 'Av. Siempre Viva 123',
      phone: '+56912345678',
      openingTime: '09:00',
      closingTime: '18:00',
      tenantId: 'tenant-uuid-1',
    };

    it('should create a branch', async () => {
      branchRepository.create.mockReturnValue(mockBranch);
      branchRepository.save.mockResolvedValue(mockBranch);

      const result = await service.create(dto);

      expect(branchRepository.create).toHaveBeenCalledWith(dto);
      expect(branchRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockBranch);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all branches', async () => {
      branchRepository.find.mockResolvedValue([mockBranch]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should filter by tenantId', async () => {
      branchRepository.find.mockResolvedValue([mockBranch]);
      const result = await service.findAll('tenant-uuid-1');
      expect(branchRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { tenantId: 'tenant-uuid-1' } }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a branch when found', async () => {
      branchRepository.findOne.mockResolvedValue(mockBranch);
      const result = await service.findOne('branch-uuid-1');
      expect(result).toEqual(mockBranch);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      branchRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findByTenant', () => {
    it('should return branches for a tenant', async () => {
      branchRepository.find.mockResolvedValue([mockBranch]);
      const result = await service.findByTenant('tenant-uuid-1');
      expect(result).toHaveLength(1);
    });
  });

  describe('update', () => {
    const dto: UpdateBranchDto = { name: 'Sucursal Norte' };

    it('should update a branch', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockBranch);
      const updated = { ...mockBranch, name: 'Sucursal Norte' };
      branchRepository.save.mockResolvedValue(updated);

      const result = await service.update('branch-uuid-1', dto);

      expect(result.name).toBe('Sucursal Norte');
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete', async () => {
      branchRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);
      await service.remove('branch-uuid-1');
      expect(branchRepository.softDelete).toHaveBeenCalledWith('branch-uuid-1');
    });
  });
});
