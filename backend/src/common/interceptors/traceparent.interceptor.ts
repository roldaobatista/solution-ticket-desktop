import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { randomUUID } from 'crypto';

function generateTraceId(): string {
  const traceId = randomUUID().replace(/-/g, '');
  const parentId = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join('');
  return `00-${traceId}-${parentId}-01`;
}

function isValidTraceparent(value: string): boolean {
  return /^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/i.test(value);
}

@Injectable()
export class TraceparentInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const incoming = request.headers['traceparent'];
    const traceparent =
      typeof incoming === 'string' && isValidTraceparent(incoming) ? incoming : generateTraceId();

    request.traceId = traceparent;
    response.setHeader('traceparent', traceparent);

    return next.handle();
  }
}
