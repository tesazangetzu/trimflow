import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification, NotificationStatus, NotificationChannel } from '../entities/notification.entity';
import { TrimflowLoggerService } from '../../../shared/logger';
import { EntityNotFoundException } from '../../../shared/exceptions';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: jest.Mocked<Repository<Notification>>;

  const mockNotification = {
    id: 'notification-uuid-1',
    channel: NotificationChannel.EMAIL,
    recipient: 'cliente@email.com',
    subject: 'Recordatorio de cita',
    content: 'Su cita es mañana a las 10:00',
    status: NotificationStatus.PENDING,
    metadata: { appointmentId: 'appointment-uuid-1' },
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: undefined,
  } as Notification;

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
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
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
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get(getRepositoryToken(Notification));
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    const data: Partial<Notification> = {
      channel: NotificationChannel.EMAIL,
      recipient: 'cliente@email.com',
      subject: 'Recordatorio de cita',
      content: 'Su cita es mañana a las 10:00',
      metadata: { appointmentId: 'appointment-uuid-1' },
    };

    it('should create a notification', async () => {
      notificationRepository.create.mockReturnValue(mockNotification);
      notificationRepository.save.mockResolvedValue(mockNotification);

      const result = await service.create(data);

      expect(notificationRepository.create).toHaveBeenCalledWith(data);
      expect(notificationRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return notifications ordered by createdAt DESC', async () => {
      notificationRepository.find.mockResolvedValue([mockNotification]);

      const result = await service.findAll();

      expect(notificationRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return a notification when found', async () => {
      notificationRepository.findOne.mockResolvedValue(mockNotification);

      const result = await service.findOne('notification-uuid-1');

      expect(result).toEqual(mockNotification);
    });

    it('should throw EntityNotFoundException when not found', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(EntityNotFoundException);
    });
  });

  describe('findByAppointment', () => {
    it('should return notifications for an appointment', async () => {
      notificationRepository.find.mockResolvedValue([mockNotification]);

      const result = await service.findByAppointment('appointment-uuid-1');

      expect(notificationRepository.find).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('markAsSent', () => {
    it('should set status to SENT', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockNotification);
      const sent = { ...mockNotification, status: NotificationStatus.SENT };
      notificationRepository.save.mockResolvedValue(sent);

      const result = await service.markAsSent('notification-uuid-1');

      expect(result.status).toBe(NotificationStatus.SENT);
      expect(mockLogger.log).toHaveBeenCalled();
    });
  });

  describe('markAsFailed', () => {
    it('should set status to FAILED and store error in metadata', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockNotification);
      const failed = {
        ...mockNotification,
        status: NotificationStatus.FAILED,
        metadata: { appointmentId: 'appointment-uuid-1', error: 'SMTP connection refused' },
      };
      notificationRepository.save.mockResolvedValue(failed);

      const result = await service.markAsFailed('notification-uuid-1', 'SMTP connection refused');

      expect(result.status).toBe(NotificationStatus.FAILED);
      expect((result.metadata as any).error).toBe('SMTP connection refused');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete', async () => {
      notificationRepository.softDelete.mockResolvedValue({ affected: 1, raw: {} } as any);

      await service.remove('notification-uuid-1');

      expect(notificationRepository.softDelete).toHaveBeenCalledWith('notification-uuid-1');
    });
  });
});
