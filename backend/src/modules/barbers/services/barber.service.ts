import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Barber } from '../entities/barber.entity';
import { CreateBarberDto } from '../dto/create-barber.dto';
import { UpdateBarberDto } from '../dto/update-barber.dto';
import { EntityNotFoundException } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';
import { IBarberService } from '../interfaces/barber-service.interface';

@Injectable()
export class BarberService implements IBarberService {
  constructor(
    @InjectRepository(Barber)
    private barberRepository: Repository<Barber>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('BarberService');
  }

  async create(createBarberDto: CreateBarberDto): Promise<Barber> {
    const barber = this.barberRepository.create(createBarberDto);
    const saved = await this.barberRepository.save(barber);
    this.logger.log(`Barber created: ${saved.id}`);
    return saved;
  }

  async findAll(branchId?: string, includeSchedules = false): Promise<Barber[]> {
    const where = branchId ? { branchId } : {};
    const barbers = await this.barberRepository.find({
      where,
      relations: includeSchedules ? ['branch', 'schedules'] : ['branch'],
    });
    if (includeSchedules) {
      for (const barber of barbers) {
        barber.schedules = barber.schedules.sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
        );
      }
    }
    return barbers;
  }

  async findOne(id: string): Promise<Barber> {
    const barber = await this.barberRepository.findOne({ where: { id }, relations: ['branch'] });
    if (!barber) {
      throw new EntityNotFoundException(`Barber with id "${id}" not found`);
    }
    return barber;
  }

  async findByBranch(branchId: string): Promise<Barber[]> {
    return this.barberRepository.find({ where: { branchId }, relations: ['branch'] });
  }

  async update(id: string, updateBarberDto: UpdateBarberDto): Promise<Barber> {
    const barber = await this.findOne(id);
    Object.assign(barber, updateBarberDto);
    const updated = await this.barberRepository.save(barber);
    this.logger.log(`Barber updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.barberRepository.softDelete(id);
    this.logger.log(`Barber soft-deleted: ${id}`);
  }
}
