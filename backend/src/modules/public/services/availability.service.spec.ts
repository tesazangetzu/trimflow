import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvailabilityService, Slot } from './availability.service';
import { Appointment, AppointmentStatus } from '../../appointments/entities/appointment.entity';
import { TenantService } from '../../tenants/services/tenant.service';
import { BranchService } from '../../branches/services/branch.service';
import { BarberService } from '../../barbers/services/barber.service';
import { ServiceService } from '../../services/services/service.service';
import { ScheduleService } from '../../schedule/services/schedule.service';
import { TenantStatus } from '../../tenants/entities/tenant.entity';

describe('AvailabilityService', () => {
  let service: AvailabilityService;

  const tenantService = {
    findBySlug: jest.fn(),
  };
  const branchService = {
    findByTenant: jest.fn(),
  };
  const barberService = {
    findOne: jest.fn(),
    findByBranch: jest.fn(),
  };
  const serviceService = {
    findOne: jest.fn(),
  };
  const scheduleService = {
    findActiveSchedule: jest.fn(),
    findBlocksByBarberAndRange: jest.fn(),
  };
  const appointmentRepository = {
    find: jest.fn(),
  };

  const activeTenant = { id: 'tenant-1', status: TenantStatus.ACTIVE };
  const branch = { id: 'branch-1', openingTime: '09:00', closingTime: '18:00' };
  const barber = { id: 'barber-1', branchId: 'branch-1' };
  const bookingService = { id: 'svc-1', branchId: 'branch-1', durationMinutes: 30 };

  const schedule = {
    id: 'schedule-1',
    barberId: 'barber-1',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvailabilityService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentRepository },
        { provide: TenantService, useValue: tenantService },
        { provide: BranchService, useValue: branchService },
        { provide: BarberService, useValue: barberService },
        { provide: ServiceService, useValue: serviceService },
        { provide: ScheduleService, useValue: scheduleService },
      ],
    }).compile();

    service = module.get<AvailabilityService>(AvailabilityService);
  });

  async function getSlots(options: { noBreak?: boolean } = {}): Promise<Slot[]> {
    const { noBreak = false } = options;
    tenantService.findBySlug.mockResolvedValue(activeTenant);
    branchService.findByTenant.mockResolvedValue([branch]);
    serviceService.findOne.mockResolvedValue(bookingService);
    barberService.findOne.mockResolvedValue(barber);
    scheduleService.findBlocksByBarberAndRange.mockResolvedValue([]);
    appointmentRepository.find.mockResolvedValue([]);

    const usedSchedule = noBreak
      ? { ...schedule, breakStartTime: null, breakEndTime: null }
      : schedule;
    scheduleService.findActiveSchedule.mockResolvedValue(usedSchedule);

    const result = await service.getAvailability('barberia-slug', 'svc-1', 'barber-1', '2026-08-10');
    return result.slots ?? [];
  }

  describe('computeSlots (via getAvailability)', () => {
    it('should exclude slots overlapping the break and keep the slot just before it', async () => {
      const times = (await getSlots()).map((s) => s.startTime);
      expect(times).not.toContain('12:00');
      expect(times).not.toContain('12:30');
      expect(times).toContain('11:30');
    });

    it('should include slots that do not touch the break', async () => {
      const times = (await getSlots()).map((s) => s.startTime);
      expect(times).toContain('10:00');
      expect(times).toContain('14:00');
      expect(times).toContain('17:30');
    });

    it('should include the slot ending exactly at breakStart', async () => {
      const times = (await getSlots()).map((s) => s.startTime);
      expect(times).toContain('11:30');
    });

    it('should include the slot starting exactly at breakEnd', async () => {
      const times = (await getSlots()).map((s) => s.startTime);
      expect(times).toContain('13:00');
    });

    it('should include all schedule slots when there is no break', async () => {
      const times = (await getSlots({ noBreak: true })).map((s) => s.startTime);
      expect(times).toContain('12:00');
      expect(times).toContain('12:30');
      expect(times).toContain('09:00');
      expect(times).toContain('17:30');
      expect(times).toHaveLength(35);
    });
  });
});