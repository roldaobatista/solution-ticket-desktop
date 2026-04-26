import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/auditoria.service';
import { Logger } from '@nestjs/common';

const SENSITIVE_FIELDS = new Set([
  'senha',
  'senhaHash',
  'password',
  'token',
  'access_token',
  'authorization',
  'chave',
  'license',
  'apiKey',
  'api_key',
  'secret',
]);

function scrubBody(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  if (Array.isArray(body)) return body.map(scrubBody);
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 1000) {
      // Capa payloads grandes (ex: base64 de imagem)
      result[key] = value.substring(0, 200) + '...[TRUNCATED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = scrubBody(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url, 'http://localhost');
    if (u.searchParams.has('access_token')) {
      u.searchParams.set('access_token', '[REDACTED]');
    }
    return u.pathname + u.search;
  } catch {
    return url.split('?')[0];
  }
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const rawUrl = request.url;
    const user = request.user;

    return next.handle().pipe(
      tap(async (response: unknown) => {
        // Only audit mutation methods
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          try {
            const respData =
              typeof response === 'object' && response !== null && 'data' in response
                ? (response as { data?: { id?: string } }).data
                : undefined;
            if (!user?.tenantId) return;

            const safeUrl = redactUrl(rawUrl);
            const safeBody = scrubBody(request.body);

            await this.auditoriaService.registrar({
              entidade: this.extractEntity(safeUrl),
              entidadeId: request.params?.id || respData?.id || 'unknown',
              evento: `${method.toLowerCase()}.${this.extractAction(safeUrl)}`,
              usuarioId: user?.id,
              tenantId: user.tenantId,
              estadoNovo: JSON.stringify({
                method,
                url: safeUrl,
                body: safeBody,
              }),
            });
          } catch (err) {
            this.logger.error(`Falha ao registrar auditoria: ${(err as Error).message}`);
          }
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const clean = url.split('?')[0];
    const parts = clean.split('/').filter(Boolean);
    const idx = parts[0] === 'api' ? 1 : 0;
    return parts[idx] || 'unknown';
  }

  private extractAction(url: string): string {
    const clean = url.split('?')[0];
    const parts = clean.split('/').filter(Boolean);
    const hasId = parts.some((p) => /^[0-9a-fA-F-]{24,36}$/.test(p));
    return hasId ? 'update' : 'create';
  }
}
