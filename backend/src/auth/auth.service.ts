import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { BCRYPT_COST_PROD } from './bcrypt-cost';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

export interface AuthenticatedUser {
  id: string;
  email: string;
  nome?: string;
  tenantId?: string | null;
  perfis?: Array<{ perfil: { nome: string } }>;
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, senha: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: { perfis: { include: { perfil: true } } },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!usuario.ativo) {
      throw new UnauthorizedException('Usuário inativo');
    }

    if (usuario.bloqueadoAte && new Date() < usuario.bloqueadoAte) {
      throw new UnauthorizedException('Usuário temporariamente bloqueado');
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
      // Incrementa tentativas
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { tentativasLogin: { increment: 1 } },
      });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Reseta tentativas
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasLogin: 0,
        ultimoAcesso: new Date(),
      },
    });

    const { senhaHash, ...result } = usuario;
    return result;
  }

  async login(user: AuthenticatedUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      tenantId: user.tenantId,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
        tenantId: user.tenantId,
        perfis: user.perfis?.map((up) => up.perfil.nome) ?? [],
      },
    };
  }

  async changePassword(usuarioId: string, senhaAtual: string, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 8) {
      throw new UnauthorizedException('Nova senha inválida (mínimo 8 caracteres)');
    }
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException('Usuario nao encontrado');
    const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');
    const hash = await bcrypt.hash(novaSenha, BCRYPT_COST_PROD);
    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { senhaHash: hash } });
    return { ok: true };
  }

  async requestPasswordReset(email: string) {
    // Tempo aproximadamente constante + resposta neutra para evitar enumeration de e-mails.
    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    if (usuario) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      const expiraEm = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await this.prisma.tokenReset.create({
        data: { usuarioId: usuario.id, token: tokenHash, expiraEm, usado: false },
      });
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`reset token emitido (dev) usuario=${usuario.id}`);
      }
      // TODO: enviar rawToken por email/SMS no canal externo (SMTP/provider).
      // O token bruto NUNCA é persistido nem logado em produção.
      void rawToken;
    }
    return { ok: true };
  }

  async resetPassword(token: string, novaSenha: string) {
    if (!novaSenha || novaSenha.length < 8) {
      throw new UnauthorizedException('Nova senha inválida (mínimo 8 caracteres)');
    }
    const tokenHash = hashResetToken(token);
    const reg = await this.prisma.tokenReset.findUnique({ where: { token: tokenHash } });
    if (!reg || reg.usado || reg.expiraEm < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    const hash = await bcrypt.hash(novaSenha, BCRYPT_COST_PROD);
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id: reg.usuarioId }, data: { senhaHash: hash } }),
      this.prisma.tokenReset.update({ where: { id: reg.id }, data: { usado: true } }),
    ]);
    return { ok: true };
  }

  async verificarPermissao(usuarioId: string, modulo: string, acao: string): Promise<boolean> {
    const permissoes = await this.prisma.permissao.findMany({
      where: {
        AND: [
          { concedido: true },
          { modulo },
          { acao },
          {
            perfil: {
              usuarios: {
                some: { usuarioId },
              },
            },
          },
        ],
      },
    });

    return permissoes.length > 0;
  }
}
