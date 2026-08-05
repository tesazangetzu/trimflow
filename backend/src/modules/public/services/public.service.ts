import { Injectable } from '@nestjs/common';
import { TenantService } from '../../tenants/services/tenant.service';
import { BranchService } from '../../branches/services/branch.service';
import { BarberService } from '../../barbers/services/barber.service';
import { ServiceService } from '../../services/services/service.service';
import { TenantStatus } from '../../tenants/entities/tenant.entity';
import { EntityNotFoundException } from '../../../shared/exceptions';

@Injectable()
export class PublicService {
  constructor(
    private tenantService: TenantService,
    private branchService: BranchService,
    private barberService: BarberService,
    private serviceService: ServiceService,
  ) {}

  async getPublicShop(slug: string) {
    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new EntityNotFoundException(`Barbería "${slug}" no encontrada`);
    }

    const branches = await this.branchService.findByTenant(tenant.id);

    const publicBranches = await Promise.all(
      branches.map(async (branch) => {
        const [barbers, services] = await Promise.all([
          this.barberService.findByBranch(branch.id),
          this.serviceService.findByBranch(branch.id),
        ]);
        return {
          id: branch.id,
          name: branch.name,
          address: branch.address ?? null,
          phone: branch.phone ?? null,
          openingTime: branch.openingTime ?? null,
          closingTime: branch.closingTime ?? null,
          barbers: barbers.map((b) => ({ id: b.id, name: b.name })),
          services: services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description ?? null,
            price: Number(s.price),
            durationMinutes: s.durationMinutes,
          })),
        };
      }),
    );

    return {
      slug: tenant.slug,
      name: tenant.name,
      email: tenant.email ?? null,
      branches: publicBranches,
    };
  }
}