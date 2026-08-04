import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { TrimflowLoggerService } from '../logger/trimflow-logger.service';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: TrimflowLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.setContext('GlobalExceptionFilter');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) ||
      (globalThis as any).crypto?.randomUUID?.() ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;

    let status: number;
    let message: string;
    let errorName: string;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        errorName = exception.name;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, unknown>;
        message = Array.isArray(resp.message)
          ? (resp.message as string[]).join(', ')
          : (resp.message as string) || exception.message;
        errorName =
          (resp.error as string) ||
          (resp.statusCode
            ? (HttpStatus[status] as string)?.replace(/_/g, ' ')
            : exception.name);
      } else {
        message = exception.message;
        errorName = exception.name;
      }

      if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
        errorName = 'Internal Server Error';
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception instanceof Error ? exception.message : 'Internal server error';
      errorName = 'Internal Server Error';
    }

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    const responseBody: Record<string, unknown> = {
      statusCode: status,
      message,
      error: errorName,
      requestId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (!isProduction && exception instanceof Error) {
      responseBody.stack = exception.stack;
    }

    this.logger.requestId = requestId;
    this.logger.error(
      `[${errorName}] ${message} — ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json(responseBody);
  }
}
