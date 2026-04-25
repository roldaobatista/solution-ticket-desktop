import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditoriaService } from '../../auditoria/auditoria.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
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
            await this.auditoriaService.registrar({
              entidade: this.extractEntity(url),
              entidadeId: request.params?.id || respData?.id || 'unknown',
              evento: `${method.toLowerCase()}.${this.extractAction(url)}`,
              usuarioId: user?.id,
              tenantId: user.tenantId,
              estadoNovo: JSON.stringify({
                method,
                url,
                body: request.body,
              }),
            });
          } catch {
            // Silently fail audit logging
          }
        }
      }),
    );
  }

  private extractEntity(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[1] || 'unknown';
  }

  private extractAction(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts.length > 2 ? 'update' : 'create';
  }
}
