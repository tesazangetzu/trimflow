import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWinstonLogger } from './winston.config';
import * as winston from 'winston';

@Injectable({ scope: Scope.TRANSIENT })
export class TrimflowLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context?: string;
  private _requestId?: string;
  private _tenantId?: string;
  private _userId?: string;

  constructor(private configService: ConfigService) {
    this.logger = createWinstonLogger(configService, this.context);
  }

  setContext(context: string) {
    this.context = context;
    this.logger = createWinstonLogger(this.configService, this.context);
  }

  set requestId(value: string | undefined) {
    this._requestId = value;
  }

  set tenantId(value: string | undefined) {
    this._tenantId = value;
  }

  set userId(value: string | undefined) {
    this._userId = value;
  }

  private prepareMeta(context?: string): Record<string, unknown> {
    const ctx = context || this.context || 'Application';
    const meta: Record<string, unknown> = {
      context: ctx,
      service: 'trimflow-api',
    };
    if (this._requestId) meta.requestId = this._requestId;
    if (this._tenantId) meta.tenantId = this._tenantId;
    if (this._userId) meta.userId = this._userId;
    return meta;
  }

  log(message: any, context?: string) {
    const meta = this.prepareMeta(context);
    this.logger.log('info', message, meta);
  }

  error(message: any, trace?: string, context?: string) {
    const meta = this.prepareMeta(context);
    if (trace) {
      meta.stack = trace;
    }
    this.logger.error(message, meta);
  }

  warn(message: any, context?: string) {
    const meta = this.prepareMeta(context);
    this.logger.warn(message, meta);
  }

  debug(message: any, context?: string) {
    const meta = this.prepareMeta(context);
    this.logger.debug(message, meta);
  }

  verbose(message: any, context?: string) {
    const meta = this.prepareMeta(context);
    this.logger.verbose(message, meta);
  }
}
