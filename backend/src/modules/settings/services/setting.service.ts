import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { TrimflowLoggerService } from '../../../shared/logger';
import { ISettingService } from '../interfaces/setting-service.interface';

@Injectable()
export class SettingService implements ISettingService {
  constructor(
    @InjectRepository(Setting)
    private settingRepository: Repository<Setting>,
    private logger: TrimflowLoggerService,
  ) { this.logger.setContext('SettingService'); }

  async get(key: string, branchId?: string): Promise<string | undefined> {
    const where: any = { key };
    if (branchId) where.branchId = branchId;
    const setting = await this.settingRepository.findOne({ where });
    return setting?.value;
  }

  async set(key: string, value: string, branchId?: string, description?: string): Promise<Setting> {
    const where: any = { key };
    if (branchId) where.branchId = branchId;
    let setting = await this.settingRepository.findOne({ where });
    if (setting) {
      setting.value = value;
      if (description !== undefined) setting.description = description;
    } else {
      setting = this.settingRepository.create({ key, value, branchId, description });
    }
    const saved = await this.settingRepository.save(setting);
    this.logger.log(`Setting ${key} = ${value}`);
    return saved;
  }

  async getAll(branchId?: string): Promise<Setting[]> {
    const where = branchId ? { branchId } : {};
    return this.settingRepository.find({ where, order: { key: 'ASC' } });
  }

  async delete(key: string, branchId?: string): Promise<void> {
    const where: any = { key };
    if (branchId) where.branchId = branchId;
    await this.settingRepository.softDelete(where);
    this.logger.log(`Setting deleted: ${key}`);
  }
}
