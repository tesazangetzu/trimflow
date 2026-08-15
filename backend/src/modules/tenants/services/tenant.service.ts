import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { ITenantService } from '../interfaces/tenants-service.interface';
import { EntityNotFoundException, BusinessRuleViolation } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';
import { slugify } from '../../../shared/utils/slugify';

@Injectable()
export class TenantService implements ITenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('TenantService');
  }

  private async isSlugTaken(slug: string, excludeId?: string): Promise<boolean> {
    const existing = await this.tenantRepository.findOne({
      where: { slug },
      withDeleted: true,
    });
    if (!existing) return false;
    if (excludeId && existing.id === excludeId) return false;
    return true;
  }

  private async resolveUniqueSlug(base: string, excludeId?: string): Promise<string> {
    const normalized = slugify(base) || 'tenant';
    if (!(await this.isSlugTaken(normalized, excludeId))) return normalized;

    let suffix = 2;
    for (;;) {
      const candidate = `${normalized}-${suffix}`;
      if (!(await this.isSlugTaken(candidate, excludeId))) return candidate;
      suffix += 1;
    }
  }

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const requested = createTenantDto.slug
      ? slugify(createTenantDto.slug)
      : slugify(createTenantDto.name);
    const finalSlug = await this.resolveUniqueSlug(requested);

    if (createTenantDto.slug && finalSlug !== requested) {
      this.logger.log(`Slug "${requested}" taken — using "${finalSlug}"`);
    }

    const tenant = this.tenantRepository.create({ ...createTenantDto, slug: finalSlug });
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

  async findMyTenant(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new EntityNotFoundException(`Tenant with id "${tenantId}" not found`);
    }
    this.logger.log(`Tenant looked up for self: ${tenantId}`);
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({ where: { slug } });
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);

    if (updateTenantDto.slug !== undefined) {
      const desired = slugify(updateTenantDto.slug);
      if (desired !== tenant.slug && (await this.isSlugTaken(desired, id))) {
        throw new BusinessRuleViolation(`Slug "${desired}" already exists`);
      }
      tenant.slug = desired;
    }

    Object.assign(tenant, updateTenantDto, { slug: tenant.slug });
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