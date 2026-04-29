import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import type { Request } from 'express';
import { AuthService, AuthenticatedUser } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'senha', passReqToCallback: true });
  }

  async validate(req: Request, email: string, senha: string): Promise<AuthenticatedUser> {
    const tenantId =
      typeof req.body?.tenantId === 'string' && req.body.tenantId.trim()
        ? req.body.tenantId.trim()
        : undefined;
    const user = await this.authService.validateUser(email, senha, tenantId);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
