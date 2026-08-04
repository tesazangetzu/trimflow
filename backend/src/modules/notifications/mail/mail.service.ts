import { Injectable } from '@nestjs/common';
import { TrimflowLoggerService } from '../../../shared/logger';

@Injectable()
export class MailService {
  constructor(private logger: TrimflowLoggerService) {
    this.logger.setContext('MailService');
  }

  async sendEmail(to: string, subject: string, content: string): Promise<boolean> {
    this.logger.log(`[DEV-MAIL] To: ${to}`);
    this.logger.log(`[DEV-MAIL] Subject: ${subject}`);
    this.logger.log(`[DEV-MAIL] Content: ${content}`);
    // En producción aquí iría nodemailer o similar
    return true;
  }
}