import { Schedule } from '../entities/schedule.entity';
import { AvailabilityBlock } from '../entities/availability-block.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { CreateBlockDto } from '../dto/create-block.dto';
import { UpdateBlockDto } from '../dto/update-block.dto';

export interface IScheduleService {
  create(dto: CreateScheduleDto): Promise<Schedule>;
  findAll(barberId?: string): Promise<Schedule[]>;
  findOne(id: string): Promise<Schedule>;
  update(id: string, dto: UpdateScheduleDto): Promise<Schedule>;
  remove(id: string): Promise<void>;
  createBlock(dto: CreateBlockDto): Promise<AvailabilityBlock>;
  findAllBlocks(barberId?: string): Promise<AvailabilityBlock[]>;
  findOneBlock(id: string): Promise<AvailabilityBlock>;
  updateBlock(id: string, dto: UpdateBlockDto): Promise<AvailabilityBlock>;
  removeBlock(id: string): Promise<void>;
  isBarberAvailable(barberId: string, start: Date, end: Date): Promise<boolean>;
  findActiveSchedule(barberId: string, dayOfWeek: number): Promise<Schedule | null>;
  findBlocksByBarberAndRange(barberId: string, start: Date, end: Date): Promise<AvailabilityBlock[]>;
}
