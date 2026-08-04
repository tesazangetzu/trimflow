import { Notification } from '../entities/notification.entity';

export interface INotificationService {
  create(data: Partial<Notification>): Promise<Notification>;
  findAll(): Promise<Notification[]>;
  findOne(id: string): Promise<Notification>;
  findByAppointment(appointmentId: string): Promise<Notification[]>;
  markAsSent(id: string): Promise<Notification>;
  markAsFailed(id: string, error: string): Promise<Notification>;
  remove(id: string): Promise<void>;
}
