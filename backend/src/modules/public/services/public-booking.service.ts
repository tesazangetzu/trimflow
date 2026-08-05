import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { Customer } from '../../customers/entities/customer.entity';
import { TenantService } from '../../tenants/services/tenant.service';
import { BranchService } from '../../branches/services/branch.service';
import { BarberService } from '../../barbers/services/barber.service';
import { ServiceService } from '../../services/services/service.service';
import { CustomerService } from '../../customers/services/customer.service';
import { ScheduleService } from '../../schedule/services/schedule.service';
import { TenantStatus } from '../../tenants/entities/tenant.entity';
import { CreatePublicAppointmentDto } from '../dto/create-public-appointment.dto';
import { CustomerLookupDto } from '../dto/customer-lookup.dto';
import { EntityNotFoundException, BusinessRuleViolation } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';

@Injectable()
export class PublicBookingService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    private tenantService: TenantService,
    private branchService: BranchService,
    private barberService: BarberService,
    private serviceService: ServiceService,
    private customerService: CustomerService,
    private scheduleService: ScheduleService,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('PublicBookingService');
  }

  async lookupCustomer(slug: string, dto: CustomerLookupDto) {
    const tenant = await this.resolveTenant(slug);
    const branches = await this.branchService.findByTenant(tenant.id);
    const branchIds = branches.map((b) => b.id);

    const normalizedEmail = dto.email.trim().toLowerCase();

    const customer = await this.customerRepository.findOne({
      where: { email: normalizedEmail, branchId: branchIds.length === 1 ? branchIds[0] : In(branchIds) },
      order: { createdAt: 'DESC' },
    });

    if (!customer) {
      throw new EntityNotFoundException(`No se encontró un cliente con el email "${dto.email}"`);
    }

    return { name: customer.name, email: customer.email, phone: customer.phone ?? null, notes: customer.notes ?? null };
  }

  async createAppointment(slug: string, dto: CreatePublicAppointmentDto) {
    const tenant = await this.resolveTenant(slug);
    const branches = await this.branchService.findByTenant(tenant.id);
    const branchIds = new Set(branches.map((b) => b.id));

    const service = await this.serviceService.findOne(dto.serviceId);
    if (!branchIds.has(service.branchId)) {
      throw new EntityNotFoundException(`Servicio "${dto.serviceId}" no encontrado en esta barbería`);
    }
    const branch = branches.find((b) => b.id === service.branchId)!;

    if (!dto.barberId) {
      throw new BusinessRuleViolation('barberId es requerido para reservar');
    }
    const barber = await this.barberService.findOne(dto.barberId);
    if (barber.branchId !== branch.id) {
      throw new EntityNotFoundException(`Barbero "${dto.barberId}" no encontrado en esta barbería`);
    }

    const startTime = new Date(dto.startTime);
    if (Number.isNaN(startTime.getTime())) {
      throw new BusinessRuleViolation('startTime inválido');
    }
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60000);

    if (startTime < new Date()) {
      throw new BusinessRuleViolation('No se puede reservar en el pasado');
    }

    if (!branch.openingTime || !branch.closingTime) {
      throw new BusinessRuleViolation('La barbería no tiene horario de atención configurado');
    }
    const open = this.dateTimeAt(branch.openingTime, startTime);
    const close = this.dateTimeAt(branch.closingTime, startTime);
    if (startTime < open || endTime > close) {
      throw new BusinessRuleViolation('El horario seleccionado está fuera del horario de atención');
    }

    const available = await this.scheduleService.isBarberAvailable(barber.id, startTime, endTime);
    if (!available) {
      throw new BusinessRuleViolation('El barbero no está disponible en el horario seleccionado');
    }

    const conflicts = await this.appointmentRepository.find({
      where: {
        barberId: barber.id,
        status: AppointmentStatus.SCHEDULED,
        startTime: LessThanOrEqual(endTime),
        endTime: MoreThanOrEqual(startTime),
      },
    });
    if (conflicts.length > 0) {
      throw new BusinessRuleViolation('El horario seleccionado ya no está disponible');
    }

    const normalizedEmail = dto.email.trim().toLowerCase();
    let customer = await this.customerService.findByEmailAndBranch(normalizedEmail, branch.id);
    if (customer) {
      customer.name = dto.name;
      if (dto.phone) customer.phone = dto.phone;
      if (dto.notes) customer.notes = dto.notes;
      customer = await this.customerService.update(customer.id, {
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes,
      });
    } else {
      customer = await this.customerService.create({
        name: dto.name,
        email: normalizedEmail,
        phone: dto.phone,
        notes: dto.notes,
        branchId: branch.id,
      });
    }

    const appointment = this.appointmentRepository.create({
      startTime,
      endTime,
      status: AppointmentStatus.SCHEDULED,
      barberId: barber.id,
      customerId: customer.id,
      serviceId: service.id,
      notes: dto.notes,
    });
    const saved = await this.appointmentRepository.save(appointment);
    this.logger.log(`Public appointment created: ${saved.id} for barber ${barber.id} at branch ${branch.id}`);
    return saved;
  }

  private async resolveTenant(slug: string) {
    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new EntityNotFoundException(`Barbería "${slug}" no encontrada`);
    }
    return tenant;
  }

  private dateTimeAt(time: string, reference: Date): Date {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(reference);
    d.setHours(h, m, 0, 0);
    return d;
  }
}