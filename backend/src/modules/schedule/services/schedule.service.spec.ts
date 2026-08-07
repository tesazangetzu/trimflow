import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleService } from './schedule.service';
import { Schedule } from '../entities/schedule.entity';
import { AvailabilityBlock } from '../entities/availability-block.entity';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { TrimflowLoggerService } from '../../../shared/logger';
import { BusinessRuleViolation } from '../../../shared/exceptions';

describe('ScheduleService', () => {
  let service: ScheduleService;
  let scheduleRepository: jest.Mocked<Repository<Schedule>>;
  let blockRepository: jest.Mocked<Repository<AvailabilityBlock>>;

  const mockLogger = {
    setContext: jest.fn(),
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const baseSchedule = {
    id: 'schedule-uuid-1',
    barberId: 'barber-uuid-1',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:00',
    breakStartTime: '12:00',
    breakEndTime: '13:00',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Schedule;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: {
            create: jest.fn((d: unknown) => d),
            save: jest.fn((e: unknown) => Promise.resolve(e)),
            findOne: jest.fn(),
            find: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(AvailabilityBlock),
          useValue: {
            create: jest.fn((d: unknown) => d),
            save: jest.fn((e: unknown) => Promise.resolve(e)),
            findOne: jest.fn(),
            find: jest.fn(),
            softDelete: jest.fn(),
          },
        },
        {
          provide: TrimflowLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<ScheduleService>(ScheduleService);
    scheduleRepository = module.get(getRepositoryToken(Schedule));
    blockRepository = module.get(getRepositoryToken(AvailabilityBlock));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create (validateBreak)', () => {
    const validDto: CreateScheduleDto = {
      barberId: 'barber-uuid-1',
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
    };

    it('should create a schedule with a valid break', async () => {
      const result = await service.create({ ...validDto });
      expect(scheduleRepository.create).toHaveBeenCalled();
      expect(scheduleRepository.save).toHaveBeenCalled();
      expect(result).toEqual(expect.any(Object));
    });

    it('should validate a break at exact schedule boundaries', async () => {
      const result = await service.create({
        ...validDto,
        breakStartTime: '09:00',
        breakEndTime: '18:00',
      });
      expect(result).toBeDefined();
      expect(scheduleRepository.save).toHaveBeenCalled();
    });

    it('should create a schedule when both break fields are undefined', async () => {
      const result = await service.create({
        barberId: 'barber-uuid-1',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '18:00',
      });
      expect(result).toBeDefined();
      expect(scheduleRepository.save).toHaveBeenCalled();
    });

    it('should throw when only breakStartTime is provided', async () => {
      await expect(
        service.create({ ...validDto, breakEndTime: undefined }),
      ).rejects.toThrow(BusinessRuleViolation);
    });

    it('should throw when only breakEndTime is provided', async () => {
      await expect(
        service.create({ ...validDto, breakStartTime: undefined }),
      ).rejects.toThrow(BusinessRuleViolation);
    });

    it('should throw when breakStart >= breakEnd', async () => {
      await expect(
        service.create({ ...validDto, breakStartTime: '13:00', breakEndTime: '13:00' }),
      ).rejects.toThrow(BusinessRuleViolation);
    });

    it('should throw when break starts before schedule start', async () => {
      await expect(
        service.create({ ...validDto, breakStartTime: '08:00', breakEndTime: '09:30' }),
      ).rejects.toThrow(BusinessRuleViolation);
    });

    it('should throw when break ends after schedule end', async () => {
      await expect(
        service.create({ ...validDto, breakStartTime: '17:00', breakEndTime: '19:00' }),
      ).rejects.toThrow(BusinessRuleViolation);
    });
  });

  describe('update (validateBreak)', () => {
    it('should update a schedule with a valid break', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(baseSchedule);
      const dto: UpdateScheduleDto = { breakStartTime: '12:30', breakEndTime: '13:30' };
      const result = await service.update('schedule-uuid-1', dto);
      expect(scheduleRepository.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw when updating with an invalid break', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(baseSchedule);
      const dto: UpdateScheduleDto = { breakStartTime: '14:00', breakEndTime: '13:00' };
      await expect(service.update('schedule-uuid-1', dto)).rejects.toThrow(
        BusinessRuleViolation,
      );
    });
  });

  describe('isBarberAvailable', () => {
    const activeSchedule = {
      ...baseSchedule,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
    } as Schedule;

    it('should return false when schedule is not found', async () => {
      scheduleRepository.findOne.mockResolvedValue(null);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T10:00:00'),
        new Date('2026-08-10T10:30:00'),
      );
      expect(result).toBe(false);
    });

    it('should return false when the appointment is inside the break', async () => {
      scheduleRepository.findOne.mockResolvedValue(activeSchedule);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T12:15:00'),
        new Date('2026-08-10T12:45:00'),
      );
      expect(result).toBe(false);
    });

    it('should return true when outside the break with no blocks', async () => {
      scheduleRepository.findOne.mockResolvedValue(activeSchedule);
      blockRepository.find.mockResolvedValue([]);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T10:00:00'),
        new Date('2026-08-10T10:30:00'),
      );
      expect(result).toBe(true);
    });

    it('should return false when the appointment crosses the break boundary', async () => {
      scheduleRepository.findOne.mockResolvedValue(activeSchedule);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T11:45:00'),
        new Date('2026-08-10T12:15:00'),
      );
      expect(result).toBe(false);
    });

    it('should return true when the appointment starts right after breakEnd', async () => {
      scheduleRepository.findOne.mockResolvedValue(activeSchedule);
      blockRepository.find.mockResolvedValue([]);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T13:00:00'),
        new Date('2026-08-10T14:00:00'),
      );
      expect(result).toBe(true);
    });

    it('should return false when the appointment is outside the schedule', async () => {
      scheduleRepository.findOne.mockResolvedValue(activeSchedule);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T08:00:00'),
        new Date('2026-08-10T08:30:00'),
      );
      expect(result).toBe(false);
    });

    it('should return false when an active block overlaps the range', async () => {
      scheduleRepository.findOne.mockResolvedValue(activeSchedule);
      blockRepository.find.mockResolvedValue([
        {
          id: 'block-1',
          barberId: 'barber-uuid-1',
          startDateTime: new Date('2026-08-10T10:00:00'),
          endDateTime: new Date('2026-08-10T11:00:00'),
        } as AvailabilityBlock,
      ]);
      const result = await service.isBarberAvailable(
        'barber-uuid-1',
        new Date('2026-08-10T10:15:00'),
        new Date('2026-08-10T10:45:00'),
      );
      expect(result).toBe(false);
    });
  });
});