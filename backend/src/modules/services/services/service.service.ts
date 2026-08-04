import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from '../entities/service.entity';
import { CreateServiceDto } from '../dto/create-service.dto';
import { UpdateServiceDto } from '../dto/update-service.dto';
import { EntityNotFoundException } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';
import { IServiceService } from '../interfaces/service-service.interface';

@Injectable()
export class ServiceService implements IServiceService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('ServiceService');
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create(dto);
    const saved = await this.serviceRepository.save(service);
    this.logger.log(`Service created: ${saved.id}`);
    return saved;
  }

  async findAll(branchId?: string): Promise<Service[]> {
    const where = branchId ? { branchId } : {};
    return this.serviceRepository.find({ where, relations: ['branch'] });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({ where: { id }, relations: ['branch'] });
    if (!service) throw new EntityNotFoundException(`Service with id "${id}" not found`);
    return service;
  }

  async findByBranch(branchId: string): Promise<Service[]> {
    return this.serviceRepository.find({ where: { branchId } });
  }

  async update(id: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    const updated = await this.serviceRepository.save(service);
    this.logger.log(`Service updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.serviceRepository.softDelete(id);
    this.logger.log(`Service soft-deleted: ${id}`);
  }
}
