import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TrimflowLoggerService } from '../logger/trimflow-logger.service';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly logger: TrimflowLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.headers['x-request-id'] || crypto.randomUUID();

    request.requestId = requestId;
    request.headers['x-request-id'] = requestId;

    const response = context.switchToHttp().getResponse();
    response.setHeader('X-Request-Id', requestId);

    this.logger.requestId = requestId;

    return next.handle();
  }
}
