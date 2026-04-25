import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

@Injectable()
export class TraceparentInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const traceparent =
      request.headers['traceparent'] ||
      `00-${randomUUID().replace(/-/g, '')}-00-${randomUUID().slice(0, 2)}`;

    request.traceId = traceparent;
    response.setHeader('traceparent', traceparent);

    return next.handle();
  }
}
