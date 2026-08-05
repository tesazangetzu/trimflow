import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { TenantService } from '../../tenants/services/tenant.service';
import { BranchService } from '../../branches/services/branch.service';
import { BarberService } from '../../barbers/services/barber.service';
import { ServiceService } from '../../services/services/service.service';
import { ScheduleService } from '../../schedule/services/schedule.service';
import { TenantStatus } from '../../tenants/entities/tenant.entity';
import { EntityNotFoundException } from '../../../shared/exceptions';

export interface Slot {
  startTime: string;
  past: boolean;
}

export interface SlotByBarber {
  barberId: string;
  slots: Slot[];
}

export interface AvailabilityResponse {
  date: string;
  serviceId: string;
  durationMinutes: number;
  barberId: string | null;
  slots?: Slot[];
  barbers?: SlotByBarber[];
}

const SLOT_STEP_MINUTES = 15;

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
    private tenantService: TenantService,
    private branchService: BranchService,
    private barberService: BarberService,
    private serviceService: ServiceService,
    private scheduleService: ScheduleService,
  ) {}

  async getAvailability(slug: string, serviceId: string, barberId?: string, date?: string): Promise<AvailabilityResponse> {
    const tenant = await this.tenantService.findBySlug(slug);
    if (!tenant || tenant.status !== TenantStatus.ACTIVE) {
      throw new EntityNotFoundException(`Barbería "${slug}" no encontrada`);
    }
    const branches = await this.branchService.findByTenant(tenant.id);
    const branchIds = new Set(branches.map((b) => b.id));

    const service = await this.serviceService.findOne(serviceId);
    if (!branchIds.has(service.branchId)) {
      throw new EntityNotFoundException(`Servicio "${serviceId}" no encontrado en esta barbería`);
    }
    const branch = branches.find((b) => b.id === service.branchId)!;

    let barbers;
    if (barberId) {
      const barber = await this.barberService.findOne(barberId);
      if (barber.branchId !== branch.id) {
        throw new EntityNotFoundException(`Barbero "${barberId}" no encontrado en esta barbería`);
      }
      barbers = [barber];
    } else {
      barbers = await this.barberService.findByBranch(branch.id);
    }

    const targetDate = date ?? this.todayStr();
    const dayStart = new Date(`${targetDate}T00:00:00`);
    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);
    const dayOfWeek = dayStart.getDay();
    const now = new Date();

    const slotsByBarber = await this.buildSlotsByBarber({
      targetDate,
      dayStart,
      dayEnd,
      dayOfWeek,
      barbers,
      branch,
      service,
      now,
    });

    const output = {
      date: targetDate,
      serviceId,
      durationMinutes: service.durationMinutes,
    };

    if (barberId) {
      return {
        ...output,
        barberId,
        slots: slotsByBarber[0]?.slots ?? [],
      };
    }

    return { ...output, barberId: null, barbers: slotsByBarber };
  }

  private async buildSlotsByBarber(params: {
    targetDate: string;
    dayStart: Date;
    dayEnd: Date;
    dayOfWeek: number;
    barbers: Array<{ id: string }>;
    branch: { openingTime?: string | null; closingTime?: string | null };
    service: { durationMinutes: number };
    now: Date;
  }): Promise<SlotByBarber[]> {
    const { targetDate, dayStart, dayEnd, dayOfWeek, barbers, branch, service, now } = params;

    if (!branch.openingTime || !branch.closingTime) {
      return barbers.map((barber) => ({ barberId: barber.id, slots: [] }));
    }

    const result: SlotByBarber[] = [];
    for (const barber of barbers) {
      const schedule = await this.scheduleService.findActiveSchedule(barber.id, dayOfWeek);
      if (!schedule) {
        result.push({ barberId: barber.id, slots: [] });
        continue;
      }

      const [blocks, appointments] = await Promise.all([
        this.scheduleService.findBlocksByBarberAndRange(barber.id, dayStart, dayEnd),
        this.appointmentRepository.find({
          where: {
            barberId: barber.id,
            status: AppointmentStatus.SCHEDULED,
            startTime: LessThanOrEqual(dayEnd),
            endTime: MoreThanOrEqual(dayStart),
          },
        }),
      ]);

      const slots = this.computeSlots({
        targetDate,
        branch,
        schedule,
        service,
        blocks,
        appointments,
        now,
      });

      result.push({ barberId: barber.id, slots });
    }
    return result;
  }

  private computeSlots(params: {
    targetDate: string;
    branch: { openingTime?: string | null; closingTime?: string | null };
    schedule: { startTime: string; endTime: string; breakStartTime?: string | null; breakEndTime?: string | null };
    service: { durationMinutes: number };
    blocks: Array<{ startDateTime: Date; endDateTime: Date }>;
    appointments: Array<{ startTime: Date; endTime: Date }>;
    now: Date;
  }): Slot[] {
    const { targetDate, branch, schedule, service, blocks, appointments, now } = params;
    const duration = service.durationMinutes;

    const branchOpen = this.dateTime(targetDate, branch.openingTime!);
    const branchClose = this.dateTime(targetDate, branch.closingTime!);
    const scheduleStart = this.dateTime(targetDate, schedule.startTime);
    const scheduleEnd = this.dateTime(targetDate, schedule.endTime);
    const breakStart = schedule.breakStartTime ? this.dateTime(targetDate, schedule.breakStartTime) : null;
    const breakEnd = schedule.breakEndTime ? this.dateTime(targetDate, schedule.breakEndTime) : null;

    const startMin = scheduleStart.getHours() * 60 + scheduleStart.getMinutes();
    const endMin = scheduleEnd.getHours() * 60 + scheduleEnd.getMinutes();

    const slots: Slot[] = [];
    for (let t = startMin; t + duration <= endMin; t += SLOT_STEP_MINUTES) {
      const slotStart = this.dateTime(targetDate, this.minToTime(t));
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);

      if (slotStart < branchOpen || slotEnd > branchClose) continue;
      if (breakStart && breakEnd && slotStart < breakEnd && slotEnd > breakStart) continue;
      if (blocks.some((b) => slotStart < b.endDateTime && slotEnd > b.startDateTime)) continue;
      if (appointments.some((a) => slotStart < a.endTime && slotEnd > a.startTime)) continue;

      slots.push({ startTime: this.minToTime(t), past: slotStart < now });
    }
    return slots;
  }

  private dateTime(dateStr: string, time: string): Date {
    const [h, m] = time.split(':').map(Number);
    const d = new Date(`${dateStr}T00:00:00`);
    d.setHours(h, m, 0, 0);
    return d;
  }

  private minToTime(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  private todayStr(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}