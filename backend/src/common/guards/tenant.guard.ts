import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se o usuário ainda não foi autenticado (ex: JwtAuthGuard ainda não rodou),
    // permitimos passar. O guard de autenticação será responsável por bloquear
    // se necessário. Isso evita conflito de ordem entre APP_GUARDs globais.
    if (!user) return true;

    if (!user.tenantId) {
      throw new ForbiddenException('Acesso negado: tenantId ausente no token JWT');
    }

    // Anexa tenantId ao request para uso em interceptors/services
    request.tenantId = user.tenantId;
    return true;
  }
}
