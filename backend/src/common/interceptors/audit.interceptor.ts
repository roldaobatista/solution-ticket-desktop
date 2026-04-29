import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/auditoria.service';
import { Logger } from '@nestjs/common';

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
      concatMap(async (response: unknown) => {
        await this.auditMutation(method, rawUrl, user, request.params, response);
        return response;
      }),
    );
  }

  private async auditMutation(
    method: string,
    rawUrl: string,
    user: { id?: string; tenantId?: string } | undefined,
    params: { id?: string } | undefined,
    response: unknown,
  ): Promise<void> {
    // Only audit mutation methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || !user?.tenantId) {
      return;
    }

    try {
      const respData =
        typeof response === 'object' && response !== null && 'data' in response
          ? (response as { data?: { id?: string } }).data
          : undefined;

      const safeUrl = redactUrl(rawUrl);
      // F-009: minimizar payload de auditoria — nao armazenar body completo
      const entidade = this.extractEntity(safeUrl);
      const entidadeId = params?.id || respData?.id || 'unknown';
      const acao = this.extractAction(safeUrl);

      const estadoNovo: Record<string, unknown> = { entidade, acao, id: entidadeId };
      if (method === 'PUT' || method === 'PATCH') {
        // Em updates, registrar apenas que houve alteracao (sem body completo)
        estadoNovo.alterado = true;
      }

      await this.auditoriaService.registrar({
        entidade,
        entidadeId,
        evento: `${method.toLowerCase()}.${acao}`,
        usuarioId: user.id,
        tenantId: user.tenantId,
        estadoNovo: JSON.stringify(estadoNovo),
      });
    } catch (err) {
      this.logger.error(`Falha ao registrar auditoria: ${(err as Error).message}`);
    }
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
