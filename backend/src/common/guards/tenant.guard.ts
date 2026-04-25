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

    // Closed-by-default: se não há usuário autenticado e o endpoint não é público,
    // negamos imediatamente. Isso previne bypass se JwtAuthGuard for esquecido.
    if (!user) {
      throw new ForbiddenException('Acesso negado: autenticação requerida');
    }

    if (!user.tenantId) {
      throw new ForbiddenException('Acesso negado: tenantId ausente no token JWT');
    }

    // Anexa tenantId ao request para uso em interceptors/services
    request.tenantId = user.tenantId;
    return true;
  }
}
