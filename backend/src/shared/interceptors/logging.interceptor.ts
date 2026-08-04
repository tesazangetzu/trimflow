import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TrimflowLoggerService } from '../logger/trimflow-logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: TrimflowLoggerService) {
    this.logger.setContext('HTTP');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();

    this.logger.requestId = request.requestId || request.headers['x-request-id'];

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          this.logger.log(`${method} ${url} ${statusCode} ${duration}ms`);
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error instanceof HttpException ? error.getStatus() : 500;
          this.logger.warn(`${method} ${url} ${statusCode} ${duration}ms - ${error.message}`);
        },
      }),
    );
  }
}
