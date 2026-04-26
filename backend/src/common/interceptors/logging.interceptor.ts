import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import * as Sentry from '@sentry/node';
import { scrubPii } from '../pii.util';

interface RequestUser {
  id?: string;
  email?: string;
  tenantId?: string | null;
}

const SENSITIVE_QUERY_PARAMS = new Set([
  'access_token',
  'token',
  'authorization',
  'jwt',
  'refresh',
  'sse',
]);

function redactUrl(raw: string): string {
  try {
    const u = new URL(raw, 'http://localhost');
    for (const key of Array.from(u.searchParams.keys())) {
      if (SENSITIVE_QUERY_PARAMS.has(key.toLowerCase())) {
        u.searchParams.set(key, '[REDACTED]');
      }
    }
    return u.pathname + u.search;
  } catch {
    // Se não for URL válida, remove query string por segurança
    return raw.split('?')[0];
  }
}

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
      user?: RequestUser;
    }>();
    const start = Date.now();
    const reqId = req.requestId ?? '-';
    const safeUrl = req.url ? redactUrl(req.url) : '-';

    // SEC-006: contexto de tenant e usuario no Sentry (sem PII)
    if (req.user) {
      Sentry.setUser({ id: req.user.id });
      if (req.user.tenantId) {
        Sentry.setTag('tenantId', req.user.tenantId);
      }
    }

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`[${reqId}] ${req.method} ${safeUrl} -> 200 (${ms}ms)`);
        },
        error: (err) => {
          const ms = Date.now() - start;
          const status = (err as { status?: number })?.status ?? 500;
          this.logger.warn(
            `[${reqId}] ${req.method} ${safeUrl} -> ${status} (${ms}ms) body=${JSON.stringify(scrubPii(req.body))}`,
          );
        },
      }),
    );
  }
}
