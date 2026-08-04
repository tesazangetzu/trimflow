import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { ITenantService } from '../interfaces/tenants-service.interface';
import { EntityNotFoundException, BusinessRuleViolation } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';

@Injectable()
export class TenantService implements ITenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('TenantService');
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({
      where: { slug: createTenantDto.slug },
      withDeleted: true,
    });
    if (existing) {
      throw new BusinessRuleViolation(`Slug "${createTenantDto.slug}" already exists`);
    }
    const tenant = this.tenantRepository.create(createTenantDto);
    const saved = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant created: ${saved.id} (${saved.slug})`);
    return saved;
  }

  async findAll(): Promise<Tenant[]> {
    return this.tenantRepository.find();
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) {
      throw new EntityNotFoundException(`Tenant with id "${id}" not found`);
    }
    return tenant;
  }

  async findById(id: string): Promise<Tenant> {
    return this.findOne(id);
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, updateTenantDto);
    const updated = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.tenantRepository.softDelete(id);
    this.logger.log(`Tenant soft-deleted: ${id}`);
  }

  async activate(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.ACTIVE;
    const saved = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant activated: ${id}`);
    return saved;
  }

  async suspend(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.status = TenantStatus.SUSPENDED;
    const saved = await this.tenantRepository.save(tenant);
    this.logger.log(`Tenant suspended: ${id}`);
    return saved;
  }
}