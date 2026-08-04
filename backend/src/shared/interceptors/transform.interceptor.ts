import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface StandardResponse<T = unknown> {
  statusCode: number;
  message: string;
  data: T | null;
  requestId: string;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T = unknown> implements NestInterceptor<T, StandardResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.requestId || request.headers['x-request-id'] || '';

    return next.handle().pipe(
      map((data) => ({
        statusCode: context.switchToHttp().getResponse().statusCode,
        message: 'OK',
        data: data ?? null,
        requestId,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
