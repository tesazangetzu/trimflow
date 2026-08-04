import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentService } from './appointment.service';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { CreateAppointmentDto } from '../dto/create-appointment.dto';
import { UpdateAppointmentDto } from '../dto/update-appointment.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException, DoubleBookingError, BusinessRuleViolation } from '../../../shared/exceptions';
import { BarberService } from '../../barbers/services/barber.service';
import { CustomerService } from '../../customers/services/customer.service';
import { ServiceService } from '../../services/services/service.service';
import { ScheduleService } from '../../schedule/services/schedule.service';

describe('AppointmentService', () => {
  let service: AppointmentService;
  let appointmentRepository: jest.Mocked<Repository<Appointment>>;

  const mockAppointment = {
    id: 'appointment-uuid-1',
    startTime: new Date('2026-07-28T10:00:00Z'),
    endTime: new Date('2026-07-28T10:30:00Z'),
    status: AppointmentStatus.SCHEDULED,
    notes: 'Confirmar 24h antes',
    barberId: 'barber-uuid-1',
    customerId: 'customer-uuid-1',
    serviceId: 'service-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Appointment;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: TrimflowLoggerService,
          useValue: mockLogger,
        },
        {
          provide: BarberService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 'barber-uuid-1' }) },
        },
        {
          provide: CustomerService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 'customer-uuid-1' }) },
        },
        {
          provide: ServiceService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 'service-uuid-1' }) },
        },
        {
          provide: ScheduleService,
          useValue: { isBarberAvailable: jest.fn().mockResolvedValue(true) },
        },
      ],
    }).compile();

    service = module.get<AppointmentService>(AppointmentService);
    appointmentRepository = module.get(getRepositoryToken(Appointment));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateAppointmentDto = {
      startTime: '2026-07-28T10:00:00Z',
      endTime: '2026-07-28T10:30:00Z',
      barberId: 'barber-uuid-1',
      customerId: 'customer-uuid-1',
      serviceId: 'service-uuid-1',
      notes: 'Confirmar 24h antes',
    };

    it('should create appointment when no conflicts exist', async () => {
      appointmentRepository.find.mockResolvedValue([]);
      appointmentRepository.create.mockReturnValue(mockAppointment);
      appointmentRepository.save.mockResolvedValue(mockAppointment);

      const result = await service.create(createDto);

      expect(appointmentRepository.find).toHaveBeenCalled();
      expect(appointmentRepository.create).toHaveBeenCalled();
      expect(appointmentRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockAppointment);
      expect(mockLogger.log).toHaveBeenCalled();
    });

    it('should throw DoubleBookingError when barber has a conflicting appointment', async () => {
      appointmentRepository.find.mockResolvedValue([mockAppointment]);

      await expect(service.create(createDto)).rejects.toThrow(DoubleBookingError);
      expect(appointmentRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all appointments without filters', async () => {
      appointmentRepository.find.mockResolvedValue([mockAppointment]);

      const result = await service.findAll();

      expect(appointmentRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by barberId', async () => {
      appointmentRepository.find.mockResolvedValue([mockAppointment]);

      const result = await service.findAll('barber-uuid-1');

      expect(appointmentRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should filter by date', async () => {
      appointmentRepository.find.mockResolvedValue([mockAppointment]);

      const result = await service.findAll(undefined, '2026-07-28');

      expect(appointmentRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no appointments found', async () => {
      appointmentRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return appointment when found', async () => {
      appointmentRepository.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne(mockAppointment.id);

      expect(appointmentRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockAppointment.id },
        relations: ['barber', 'customer', 'service'],
      });
      expect(result).toEqual(mockAppointment);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      appointmentRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findByBarberAndDateRange', () => {
    it('should return conflicting appointments', async () => {
      const start = new Date('2026-07-28T09:00:00Z');
      const end = new Date('2026-07-28T11:00:00Z');
      appointmentRepository.find.mockResolvedValue([mockAppointment]);

      const result = await service.findByBarberAndDateRange('barber-uuid-1', start, end);

      expect(appointmentRepository.find).toHaveBeenCalledWith({
        where: {
          barberId: 'barber-uuid-1',
          status: AppointmentStatus.SCHEDULED,
          startTime: expect.any(Object),
          endTime: expect.any(Object),
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty when no conflicts', async () => {
      appointmentRepository.find.mockResolvedValue([]);

      const result = await service.findByBarberAndDateRange(
        'barber-uuid-1',
        new Date('2026-07-29T10:00:00Z'),
        new Date('2026-07-29T11:00:00Z'),
      );

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updateDto: UpdateAppointmentDto = { notes: 'Nota actualizada' };

    it('should update and return appointment', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAppointment);
      const updated = { ...mockAppointment, notes: 'Nota actualizada' };
      appointmentRepository.save.mockResolvedValue(updated);

      const result = await service.update(mockAppointment.id, updateDto);

      expect(result.notes).toBe('Nota actualizada');
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('cancel', () => {
    it('should set status to CANCELLED', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAppointment);
      const cancelled = { ...mockAppointment, status: AppointmentStatus.CANCELLED };
      appointmentRepository.save.mockResolvedValue(cancelled);

      const result = await service.cancel(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.CANCELLED);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('complete', () => {
    it('should set status to COMPLETED', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAppointment);
      const completed = { ...mockAppointment, status: AppointmentStatus.COMPLETED };
      appointmentRepository.save.mockResolvedValue(completed);

      const result = await service.complete(mockAppointment.id);

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete the appointment', async () => {
      appointmentRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove(mockAppointment.id);

      expect(appointmentRepository.softDelete).toHaveBeenCalledWith(mockAppointment.id);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });
});
