import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationStatus } from '../entities/notification.entity';
import { EntityNotFoundException } from '../../../shared/exceptions';
import { TrimflowLoggerService } from '../../../shared/logger';
import { INotificationService } from '../interfaces/notification-service.interface';

@Injectable()
export class NotificationService implements INotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private logger: TrimflowLoggerService,
  ) {
    this.logger.setContext('NotificationService');
  }

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification created: ${saved.id} to ${saved.recipient}`);
    return saved;
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) throw new EntityNotFoundException(`Notification with id "${id}" not found`);
    return notification;
  }

  async findByAppointment(appointmentId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { metadata: { appointmentId } } as any,
    });
  }

  async markAsSent(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.status = NotificationStatus.SENT;
    const saved = await this.notificationRepository.save(notification);
    this.logger.log(`Notification sent: ${id}`);
    return saved;
  }

  async markAsFailed(id: string, error: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.status = NotificationStatus.FAILED;
    notification.metadata = { ...(notification.metadata as any), error };
    const saved = await this.notificationRepository.save(notification);
    this.logger.error(`Notification failed: ${id} - ${error}`);
    return saved;
  }

  async remove(id: string): Promise<void> {
    await this.notificationRepository.softDelete(id);
    this.logger.log(`Notification soft-deleted: ${id}`);
  }
}
