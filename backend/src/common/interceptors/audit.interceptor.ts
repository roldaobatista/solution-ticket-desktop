import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  InternalServerErrorException,
} from '@nestjs/common';
import { from, Observable } from 'rxjs';
import { concatMap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/auditoria.service';
import { Logger } from '@nestjs/common';

interface AuditContextData {
  method: string;
  user: { id?: string; tenantId: string };
  params?: { id?: string };
  entidade: string;
  acao: string;
  critical: boolean;
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
    const auditContext = this.buildAuditContext(method, rawUrl, user, request.params);

    if (!auditContext) {
      return next.handle();
    }

    if (auditContext.critical) {
      return from(this.auditCriticalPreflight(auditContext)).pipe(
        concatMap(() => next.handle()),
        concatMap(async (response: unknown) => {
          await this.auditMutation(auditContext, response);
          return response;
        }),
      );
    }

    return next.handle().pipe(
      concatMap(async (response: unknown) => {
        await this.auditMutation(auditContext, response);
        return response;
      }),
    );
  }

  private buildAuditContext(
    method: string,
    rawUrl: string,
    user: { id?: string; tenantId?: string } | undefined,
    params: { id?: string } | undefined,
  ): AuditContextData | null {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) || !user?.tenantId) {
      return null;
    }

    const safeUrl = redactUrl(rawUrl);
    const entidade = this.extractEntity(safeUrl);
    const acao = this.extractAction(safeUrl);
    const tenantId = user.tenantId;

    return {
      method,
      user: { id: user.id, tenantId },
      params,
      entidade,
      acao,
      critical: this.isCriticalEntity(entidade),
    };
  }

  private async auditCriticalPreflight(context: AuditContextData): Promise<void> {
    const entidadeId = context.params?.id || 'unknown';
    const estadoNovo = {
      entidade: context.entidade,
      acao: context.acao,
      id: entidadeId,
      fase: 'preflight',
    };

    try {
      await this.auditoriaService.registrar({
        entidade: context.entidade,
        entidadeId,
        evento: `${context.method.toLowerCase()}.${context.acao}.preflight`,
        usuarioId: context.user.id,
        tenantId: context.user.tenantId,
        estadoNovo: JSON.stringify(estadoNovo),
      });
    } catch (err) {
      this.logger.error(`Falha no preflight de auditoria critica: ${(err as Error).message}`);
      throw new InternalServerErrorException('Operacao critica abortada: auditoria indisponivel');
    }
  }

  private async auditMutation(context: AuditContextData, response: unknown): Promise<void> {
    try {
      const respData =
        typeof response === 'object' && response !== null && 'data' in response
          ? (response as { data?: { id?: string } }).data
          : undefined;

      // F-009: minimizar payload de auditoria — nao armazenar body completo
      const entidadeId = context.params?.id || respData?.id || 'unknown';

      const estadoNovo: Record<string, unknown> = {
        entidade: context.entidade,
        acao: context.acao,
        id: entidadeId,
      };
      if (context.method === 'PUT' || context.method === 'PATCH') {
        // Em updates, registrar apenas que houve alteracao (sem body completo)
        estadoNovo.alterado = true;
      }

      await this.auditoriaService.registrar({
        entidade: context.entidade,
        entidadeId,
        evento: `${context.method.toLowerCase()}.${context.acao}`,
        usuarioId: context.user.id,
        tenantId: context.user.tenantId,
        estadoNovo: JSON.stringify(estadoNovo),
      });
    } catch (err) {
      this.logger.error(`Falha ao registrar auditoria: ${(err as Error).message}`);
    }
  }

  private isCriticalEntity(entity: string): boolean {
    return [
      'tickets',
      'fatura',
      'faturas',
      'licenca',
      'backup',
      'configuracoes',
      'balanca',
      'balancas',
    ].includes(entity);
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
