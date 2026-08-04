import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MailService } from '../mail/mail.service';
import { NotificationService } from '../services/notification.service';
import { TrimflowLoggerService } from '../../../shared/logger';

export const NOTIFICATION_QUEUE = 'notifications';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  constructor(
    private mailService: MailService,
    private notificationService: NotificationService,
    private logger: TrimflowLoggerService,
  ) {
    super();
    this.logger.setContext('NotificationProcessor');
  }

  async process(job: Job<{ notificationId: string; channel: string; recipient: string; subject: string; content: string }>): Promise<void> {
    const { notificationId, channel, recipient, subject, content } = job.data;
    this.logger.log(`Processing notification ${notificationId} via ${channel}`);

    try {
      if (channel === 'email') {
        await this.mailService.sendEmail(recipient, subject, content);
      }
      await this.notificationService.markAsSent(notificationId);

      this.logger.log(`Notification ${notificationId} sent successfully via ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to send notification ${notificationId}: ${(error as Error).message}`);
      await this.notificationService.markAsFailed(notificationId, (error as Error).message);
    }
  }
}