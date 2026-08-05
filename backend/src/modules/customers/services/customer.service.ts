import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { CreateCustomerDto } from '../dto/create-customer.dto';
import { UpdateCustomerDto } from '../dto/update-customer.dto';
import { ICustomerService } from '../interfaces/customer-service.interface';
import { EntityNotFoundException } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';

@Injectable()
export class CustomerService implements ICustomerService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('CustomerService');
  }

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const customer = this.customerRepository.create(createCustomerDto);
    const saved = await this.customerRepository.save(customer);
    this.logger.log(`Customer created: ${saved.id}`);
    return saved;
  }

  async findAll(branchId?: string): Promise<Customer[]> {
    const where = branchId ? { branchId } : {};
    return this.customerRepository.find({ where });
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({ where: { id } });
    if (!customer) {
      throw new EntityNotFoundException(`Customer with id "${id}" not found`);
    }
    return customer;
  }

  async findByBranch(branchId: string): Promise<Customer[]> {
    return this.customerRepository.find({ where: { branchId } });
  }

  async findByEmail(email: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email } });
  }

  async findByEmailAndBranch(email: string, branchId: string): Promise<Customer | null> {
    return this.customerRepository.findOne({ where: { email, branchId } });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto);
    const updated = await this.customerRepository.save(customer);
    this.logger.log(`Customer updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.customerRepository.softDelete(id);
    this.logger.log(`Customer soft-deleted: ${id}`);
  }
}
