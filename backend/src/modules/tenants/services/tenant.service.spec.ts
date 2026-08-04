import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantService } from './tenant.service';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException, BusinessRuleViolation } from '../../../shared/exceptions';

describe('TenantService', () => {
  let service: TenantService;
  let tenantRepository: jest.Mocked<Repository<Tenant>>;

  const mockTenant = {
    id: 'tenant-uuid-1',
    name: 'Barbería El Clásico',
    slug: 'barberia-el-clasico',
    email: 'contacto@elclasico.com',
    status: TenantStatus.ACTIVE,
    settings: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Tenant;

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
        TenantService,
        {
          provide: getRepositoryToken(Tenant),
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

    service = module.get<TenantService>(TenantService);
    tenantRepository = module.get(getRepositoryToken(Tenant));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateTenantDto = {
      name: 'Barbería El Clásico',
      slug: 'barberia-el-clasico',
      email: 'contacto@elclasico.com',
    };

    it('should create a tenant when slug is unique', async () => {
      tenantRepository.findOne.mockResolvedValue(null);
      tenantRepository.create.mockReturnValue(mockTenant);
      tenantRepository.save.mockResolvedValue(mockTenant);

      const result = await service.create(createDto);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { slug: createDto.slug },
        withDeleted: true,
      });
      expect(tenantRepository.create).toHaveBeenCalledWith(createDto);
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockTenant);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should throw BusinessRuleViolation when slug already exists', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      await expect(service.create(createDto)).rejects.toThrow(BusinessRuleViolation);
      expect(tenantRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all tenants', async () => {
      tenantRepository.find.mockResolvedValue([mockTenant]);

      const result = await service.findAll();

      expect(tenantRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTenant);
    });

    it('should return empty array when no tenants exist', async () => {
      tenantRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a tenant when found', async () => {
      tenantRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findOne(mockTenant.id);

      expect(tenantRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTenant.id },
      });
      expect(result).toEqual(mockTenant);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      tenantRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findById', () => {
    it('should call findOne and return tenant', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTenant);

      const result = await service.findById(mockTenant.id);

      expect(service.findOne).toHaveBeenCalledWith(mockTenant.id);
      expect(result).toEqual(mockTenant);
    });
  });

  describe('update', () => {
    const updateDto: UpdateTenantDto = { name: 'Nuevo Nombre' };

    it('should update and return the tenant', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTenant);
      const updatedTenant = { ...mockTenant, name: 'Nuevo Nombre' };
      tenantRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.update(mockTenant.id, updateDto);

      expect(service.findOne).toHaveBeenCalledWith(mockTenant.id);
      expect(tenantRepository.save).toHaveBeenCalled();
      expect(result.name).toBe('Nuevo Nombre');
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should throw when tenant not found', async () => {
      jest.spyOn(service, 'findOne').mockRejectedValue(new EntityNotFoundException('Not found'));

      await expect(service.update('bad-id', updateDto)).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete the tenant', async () => {
      tenantRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove(mockTenant.id);

      expect(tenantRepository.softDelete).toHaveBeenCalledWith(mockTenant.id);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('activate', () => {
    it('should activate a suspended tenant', async () => {
      const suspendedTenant = { ...mockTenant, status: TenantStatus.SUSPENDED };
      jest.spyOn(service, 'findOne').mockResolvedValue(suspendedTenant);
      const activatedTenant = { ...suspendedTenant, status: TenantStatus.ACTIVE };
      tenantRepository.save.mockResolvedValue(activatedTenant);

      const result = await service.activate(mockTenant.id);

      expect(result.status).toBe(TenantStatus.ACTIVE);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('suspend', () => {
    it('should suspend an active tenant', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockTenant);
      const suspendedTenant = { ...mockTenant, status: TenantStatus.SUSPENDED };
      tenantRepository.save.mockResolvedValue(suspendedTenant);

      const result = await service.suspend(mockTenant.id);

      expect(result.status).toBe(TenantStatus.SUSPENDED);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });
});
