import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user?.permissoes) {
      throw new ForbiddenException('Permissões não encontradas');
    }

    const hasRole = requiredRoles.some((role) => user.permissoes.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Você não possui permissão para esta ação');
    }

    return true;
  }
}
