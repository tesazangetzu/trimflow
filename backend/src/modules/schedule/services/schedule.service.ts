import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { Schedule } from '../entities/schedule.entity';
import { AvailabilityBlock } from '../entities/availability-block.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';
import { EntityNotFoundException, BusinessRuleViolation } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';
import { IScheduleService } from '../interfaces/schedule-service.interface';

@Injectable()
export class ScheduleService implements IScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    @InjectRepository(AvailabilityBlock)
    private blockRepository: Repository<AvailabilityBlock>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('ScheduleService');
  }

  private validateBreak(
    startTime: string,
    endTime: string,
    breakStartTime?: string | null,
    breakEndTime?: string | null,
  ): void {
    const bs = breakStartTime ?? undefined;
    const be = breakEndTime ?? undefined;
    if (bs === undefined && be === undefined) return;

    if (!bs || !be) {
      throw new BusinessRuleViolation('Break must define both breakStartTime and breakEndTime (or none)');
    }

    if (bs >= be) {
      throw new BusinessRuleViolation('breakStartTime must be earlier than breakEndTime');
    }

    if (bs < startTime || be > endTime) {
      throw new BusinessRuleViolation('Break must be fully contained within schedule startTime/endTime');
    }
  }

  async create(dto: CreateScheduleDto): Promise<Schedule> {
    this.validateBreak(dto.startTime, dto.endTime, dto.breakStartTime, dto.breakEndTime);
    const schedule = this.scheduleRepository.create(dto);
    const saved = await this.scheduleRepository.save(schedule);
    this.logger.log(`Schedule created: ${saved.id} for barber ${dto.barberId}`);
    return saved;
  }

  async findAll(barberId?: string): Promise<Schedule[]> {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    return this.scheduleRepository.find({ where, order: { dayOfWeek: 'ASC', startTime: 'ASC' } });
  }

  async findOne(id: string): Promise<Schedule> {
    const schedule = await this.scheduleRepository.findOne({ where: { id } });
    if (!schedule) throw new EntityNotFoundException(`Schedule with id "${id}" not found`);
    return schedule;
  }

  async update(id: string, dto: UpdateScheduleDto): Promise<Schedule> {
    const schedule = await this.findOne(id);
    const merged = { ...schedule, ...dto };
    this.validateBreak(
      merged.startTime,
      merged.endTime,
      dto.breakStartTime !== undefined ? dto.breakStartTime : (schedule.breakStartTime as string | null | undefined),
      dto.breakEndTime !== undefined ? dto.breakEndTime : (schedule.breakEndTime as string | null | undefined),
    );
    Object.assign(schedule, dto);
    const updated = await this.scheduleRepository.save(schedule);
    this.logger.log(`Schedule updated: ${id}`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    await this.scheduleRepository.softDelete(id);
    this.logger.log(`Schedule soft-deleted: ${id}`);
  }

  async createBlock(dto: CreateBlockDto): Promise<AvailabilityBlock> {
    const block = this.blockRepository.create({
      ...dto,
      startDateTime: new Date(dto.startDateTime),
      endDateTime: new Date(dto.endDateTime),
    });
    const saved = await this.blockRepository.save(block);
    this.logger.log(`Availability block created: ${saved.id} for barber ${dto.barberId}`);
    return saved;
  }

  async findAllBlocks(barberId?: string): Promise<AvailabilityBlock[]> {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    return this.blockRepository.find({ where, order: { startDateTime: 'ASC' } });
  }

  async findOneBlock(id: string): Promise<AvailabilityBlock> {
    const block = await this.blockRepository.findOne({ where: { id } });
    if (!block) throw new EntityNotFoundException(`Availability block with id "${id}" not found`);
    return block;
  }

  async updateBlock(id: string, dto: UpdateBlockDto): Promise<AvailabilityBlock> {
    const block = await this.findOneBlock(id);
    if (dto.startDateTime) (dto as any).startDateTime = new Date(dto.startDateTime);
    if (dto.endDateTime) (dto as any).endDateTime = new Date(dto.endDateTime);
    Object.assign(block, dto);
    const updated = await this.blockRepository.save(block);
    this.logger.log(`Availability block updated: ${id}`);
    return updated;
  }

  async removeBlock(id: string): Promise<void> {
    await this.blockRepository.softDelete(id);
    this.logger.log(`Availability block soft-deleted: ${id}`);
  }

  async isBarberAvailable(barberId: string, start: Date, end: Date): Promise<boolean> {
    const dayOfWeek = start.getDay();

    const schedule = await this.scheduleRepository.findOne({
      where: { barberId, dayOfWeek, isActive: true },
    });
    if (!schedule) return false;

    const [startHours, startMinutes] = schedule.startTime.split(':').map(Number);
    const [endHours, endMinutes] = schedule.endTime.split(':').map(Number);

    const scheduleStart = new Date(start);
    scheduleStart.setHours(startHours, startMinutes, 0, 0);

    const scheduleEnd = new Date(start);
    scheduleEnd.setHours(endHours, endMinutes, 0, 0);

    if (start < scheduleStart || end > scheduleEnd) return false;

    if (schedule.breakStartTime && schedule.breakEndTime) {
      const [breakStartHours, breakStartMinutes] = schedule.breakStartTime.split(':').map(Number);
      const [breakEndHours, breakEndMinutes] = schedule.breakEndTime.split(':').map(Number);

      const breakStart = new Date(start);
      breakStart.setHours(breakStartHours, breakStartMinutes, 0, 0);

      const breakEnd = new Date(start);
      breakEnd.setHours(breakEndHours, breakEndMinutes, 0, 0);

      if (start < breakEnd && end > breakStart) return false;
    }

    const blocks = await this.blockRepository.find({
      where: {
        barberId,
        startDateTime: LessThan(end),
        endDateTime: MoreThan(start),
      },
    });

    return blocks.length === 0;
  }

  async findActiveSchedule(barberId: string, dayOfWeek: number): Promise<Schedule | null> {
    return this.scheduleRepository.findOne({
      where: { barberId, dayOfWeek, isActive: true },
    });
  }

  async findBlocksByBarberAndRange(barberId: string, start: Date, end: Date): Promise<AvailabilityBlock[]> {
    return this.blockRepository.find({
      where: {
        barberId,
        startDateTime: LessThan(end),
        endDateTime: MoreThan(start),
      },
    });
  }
}
