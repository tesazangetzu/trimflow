import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { EntityNotFoundException, DoubleBookingError, BusinessRuleViolation } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';
import { IAppointmentService } from '../interfaces/appointment-service.interface';
import { BarberService } from '../../barbers/services/barber.service';
import { ScheduleService } from '../../schedule/services/schedule.service';
import { CustomerService } from '../../customers/services/customer.service';
import { ServiceService } from '../../services/services/service.service';

@Injectable()
export class AppointmentService implements IAppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private logger: TrimflowLoggerService,
    private barberService: BarberService,
    private customerService: CustomerService,
    private serviceService: ServiceService,
    private scheduleService: ScheduleService,
  ) {
    this.logger.setContext('AppointmentService');
  }

  async create(dto: CreateAppointmentDto): Promise<Appointment> {
    // Validate that referenced entities exist
    await this.barberService.findOne(dto.barberId);
    await this.customerService.findOne(dto.customerId);
    await this.serviceService.findOne(dto.serviceId);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    const available = await this.scheduleService.isBarberAvailable(dto.barberId, startTime, endTime);
    if (!available) {
      throw new BusinessRuleViolation(`Barber ${dto.barberId} is not available at the requested time`);
    }

    const conflicts = await this.findByBarberAndDateRange(dto.barberId, startTime, endTime);
    if (conflicts.length > 0) {
      throw new DoubleBookingError(`Barber ${dto.barberId} already has an appointment at this time`);
    }

    const appointment = this.appointmentRepository.create({
      ...dto,
      startTime,
      endTime,
    });
    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment created: ${saved.id} for barber ${dto.barberId}`);
    return saved;
  }

  async findAll(barberId?: string, date?: string): Promise<Appointment[]> {
    const where: any = {};
    if (barberId) where.barberId = barberId;
    if (date) {
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      where.startTime = MoreThanOrEqual(dayStart);
      where.endTime = LessThanOrEqual(dayEnd);
    }
    return this.appointmentRepository.find({
      where,
      relations: ['barber', 'customer', 'service'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: ['barber', 'customer', 'service'],
    });
    if (!appointment) {
      throw new EntityNotFoundException(`Appointment with id "${id}" not found`);
    }
    return appointment;
  }

  async findByBarberAndDateRange(barberId: string, start: Date, end: Date): Promise<Appointment[]> {
    return this.appointmentRepository.find({
      where: {
        barberId,
        status: AppointmentStatus.SCHEDULED,
        startTime: LessThanOrEqual(end),
        endTime: MoreThanOrEqual(start),
      },
    });
  }

  async update(id: string, dto: UpdateAppointmentDto): Promise<Appointment> {
    const appointment = await this.findOne(id);
    Object.assign(appointment, dto);
    const updated = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment updated: ${id}`);
    return updated;
  }

  async cancel(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.CANCELLED;
    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment cancelled: ${id}`);
    return saved;
  }

  async complete(id: string): Promise<Appointment> {
    const appointment = await this.findOne(id);
    appointment.status = AppointmentStatus.COMPLETED;
    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Appointment completed: ${id}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.appointmentRepository.softDelete(id);
    this.logger.log(`Appointment soft-deleted: ${id}`);
  }
}
