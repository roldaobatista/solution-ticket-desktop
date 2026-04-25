import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { scrubPii } from '../pii.util';

/**
 * Loga request/response com PII redigida via scrubPii(). Reduz risco de
 * vazamento de senha/token/CPF em arquivos de log e em integracoes
 * (Sentry breadcrumbs, etc).
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<{
      method?: string;
      url?: string;
      body?: unknown;
      requestId?: string;
    }>();
    const start = Date.now();
    const reqId = req.requestId ?? '-';

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`[${reqId}] ${req.method} ${req.url} -> 200 (${ms}ms)`);
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = (err as { status?: number })?.status ?? 500;
          this.logger.warn(
            `[${reqId}] ${req.method} ${req.url} -> ${status} (${ms}ms) body=${JSON.stringify(scrubPii(req.body))}`,
          );
        },
      }),
    );
  }
}
