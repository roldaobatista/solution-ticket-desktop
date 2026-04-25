import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { requireJwtSecret } from '../jwt-secret';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: requireJwtSecret(),
    });
  }

  async validate(payload: any) {
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

    const permissoes = usuario.perfis.flatMap((up) =>
      up.perfil.permissoes.filter((p) => p.concedido).map((p) => `${p.modulo}:${p.acao}`),
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
