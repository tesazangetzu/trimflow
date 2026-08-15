import { Tenant } from '../entities/tenant.entity';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';

export interface ITenantService {
  create(createTenantDto: CreateTenantDto): Promise<Tenant>;
  findAll(): Promise<Tenant[]>;
  findOne(id: string): Promise<Tenant>;
  findById(id: string): Promise<Tenant>;
  findMyTenant(tenantId: string): Promise<Tenant>;
  findBySlug(slug: string): Promise<Tenant | null>;
  update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant>;
  remove(id: string): Promise<void>;
  activate(id: string): Promise<Tenant>;
  suspend(id: string): Promise<Tenant>;
}
