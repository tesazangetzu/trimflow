import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { UpdateLandingConfigDto } from '../dto/update-landing-config.dto';
import { LandingConfig, mergeLandingConfig, mergeObject } from '../landing-config';
import { EntityNotFoundException } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';

@Injectable()
export class LandingService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('LandingService');
  }

  /**
   * Devuelve la configuración completa de la landing del tenant
   * (guardada fusionada sobre los defaults urbano/street).
   */
  async getConfig(tenantId: string): Promise<LandingConfig> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new EntityNotFoundException('Tenant no encontrado');
    }
    return mergeLandingConfig(tenant.settings?.landing);
  }

  /**
   * Config completa + slug del tenant (para el panel admin: "ver mi landing").
   */
  async getConfigWithSlug(tenantId: string): Promise<{ slug: string; config: LandingConfig }> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new EntityNotFoundException('Tenant no encontrado');
    }
    return { slug: tenant.slug, config: mergeLandingConfig(tenant.settings?.landing) };
  }

  /**
   * Actualiza la configuración de la landing del tenant.
   * El DTO es parcial: se fusiona sobre la config guardada.
   */
  async updateConfig(tenantId: string, dto: UpdateLandingConfigDto): Promise<LandingConfig> {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new EntityNotFoundException('Tenant no encontrado');
    }

    const current = mergeLandingConfig(tenant.settings?.landing);
    // Deep-merge del DTO (parcial anidado) sobre la config guardada para no
    // perder valores de sub-bloques no enviados en esta actualización.
    const merged = mergeLandingConfig(
      mergeObject(current as unknown as Record<string, unknown>, dto),
    );

    tenant.settings = {
      ...(tenant.settings ?? {}),
      landing: merged,
    };
    await this.tenantRepository.save(tenant);
    this.logger.log(`Landing config updated for tenant ${tenantId}`);
    return merged;
  }
}