import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerService } from './customer.service';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException } from '../../../shared/exceptions';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: jest.Mocked<Repository<Customer>>;

  const mockCustomer = {
    id: 'customer-uuid-1',
    name: 'Carlos López',
    email: 'carlos@email.com',
    phone: '+56998765432',
    notes: 'Cliente prefiere cortes clásicos',
    branchId: 'branch-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Customer;

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
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
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

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get(getRepositoryToken(Customer));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const dto: CreateCustomerDto = {
      name: 'Carlos López',
      email: 'carlos@email.com',
      phone: '+56998765432',
      notes: 'Cliente prefiere cortes clásicos',
      branchId: 'branch-uuid-1',
    };

    it('should create a customer', async () => {
      customerRepository.create.mockReturnValue(mockCustomer);
      customerRepository.save.mockResolvedValue(mockCustomer);

      const result = await service.create(dto);

      expect(customerRepository.create).toHaveBeenCalledWith(dto);
      expect(customerRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockCustomer);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all customers', async () => {
      customerRepository.find.mockResolvedValue([mockCustomer]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a customer when found', async () => {
      customerRepository.findOne.mockResolvedValue(mockCustomer);
      const result = await service.findOne('customer-uuid-1');
      expect(result).toEqual(mockCustomer);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      customerRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('update', () => {
    const dto: UpdateCustomerDto = { name: 'Carlos Actualizado' };

    it('should update a customer', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockCustomer);
      const updated = { ...mockCustomer, name: 'Carlos Actualizado' };
      customerRepository.save.mockResolvedValue(updated);

      const result = await service.update('customer-uuid-1', dto);
      expect(result.name).toBe('Carlos Actualizado');
    });
  });

  describe('remove', () => {
    it('should soft-delete', async () => {
      customerRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);
      await service.remove('customer-uuid-1');
      expect(customerRepository.softDelete).toHaveBeenCalledWith('customer-uuid-1');
    });
  });
});
