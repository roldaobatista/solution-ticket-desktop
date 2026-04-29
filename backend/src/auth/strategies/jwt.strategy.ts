import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { requireJwtSecret } from '../jwt-secret';

interface JwtPayload {
  sub: string;
  email: string;
  nome: string;
  tenantId?: string | null;
  // Onda 2.3: tokenVersion (tv). JWTs com tv < usuario.tokenVersion sao
  // rejeitados (changePassword, logout e resetPassword incrementam o campo).
  tv?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      include: {
        perfis: {
          include: {
            perfil: {
              include: { permissoes: true },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException();
    }

    // Onda 2.3: rejeita JWTs com tokenVersion antiga (revogacao em massa
    // por changePassword/logout/resetPassword).
    const tokenVersionAtual = (usuario as { tokenVersion?: number }).tokenVersion ?? 0;
    const tvPayload = payload.tv ?? 0;
    if (tvPayload < tokenVersionAtual) {
      throw new UnauthorizedException('Token revogado');
    }

    const permissoes = usuario.perfis.flatMap((up) =>
      up.perfil.permissoes.filter((p) => p.concedido).map((p) => p.acao),
    );

    return {
      id: payload.sub,
      email: payload.email,
      nome: payload.nome,
      tenantId: payload.tenantId,
      permissoes,
    };
  }
}
