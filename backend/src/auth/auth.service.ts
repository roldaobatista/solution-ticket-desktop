import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { BCRYPT_COST_PROD } from './bcrypt-cost';
import { validarPoliticaSenha } from './password-policy';

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

// Onda 2.2 — bloqueio progressivo de login
const MAX_TENTATIVAS_LOGIN = 5;
const TEMPO_BLOQUEIO_MS = 15 * 60 * 1000; // 15 min

export interface AuthenticatedUser {
  id: string;
  email: string;
  nome?: string;
  tenantId?: string | null;
  tokenVersion?: number;
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
    private readonly mailer: MailerService,
  ) {}

  async validateUser(email: string, senha: string, tenantId?: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const matches = await this.prisma.usuario.findMany({
      where: { email: normalizedEmail, ...(tenantId ? { tenantId } : {}) },
      include: { perfis: { include: { perfil: true } } },
      take: 2,
    });
    if (!tenantId && matches.length > 1) {
      throw new UnauthorizedException('Tenant obrigatorio para este e-mail');
    }
    const usuario = matches[0];

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
      // Onda 2.2: bloqueio progressivo. Apos MAX_TENTATIVAS_LOGIN falhas,
      // aplica bloqueadoAte = now + TEMPO_BLOQUEIO_MS. Antes o contador
      // crescia indefinidamente sem nunca disparar bloqueio (campo existia
      // mas era mero registro).
      const novasTentativas = usuario.tentativasLogin + 1;
      const data: { tentativasLogin: number; bloqueadoAte?: Date } = {
        tentativasLogin: novasTentativas,
      };
      if (novasTentativas >= MAX_TENTATIVAS_LOGIN) {
        data.bloqueadoAte = new Date(Date.now() + TEMPO_BLOQUEIO_MS);
        data.tentativasLogin = 0; // reseta apos bloquear
      }
      await this.prisma.usuario.update({ where: { id: usuario.id }, data });
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Reseta tentativas e remove bloqueio expirado
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        tentativasLogin: 0,
        bloqueadoAte: null,
        ultimoAcesso: new Date(),
      },
    });

    const { senhaHash, ...result } = usuario;
    return result;
  }

  async login(user: AuthenticatedUser) {
    // Onda 2.3: payload inclui tokenVersion ('tv'). JwtStrategy compara
    // com o valor atual no DB e rejeita tokens com versao antiga.
    const payload = {
      sub: user.id,
      email: user.email,
      nome: user.nome,
      tenantId: user.tenantId,
      tv: user.tokenVersion ?? 0,
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
    // Onda 2.7: politica de senha centralizada (10+ chars, letra+numero).
    validarPoliticaSenha(novaSenha);
    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) throw new UnauthorizedException('Usuario nao encontrado');
    const ok = await bcrypt.compare(senhaAtual, usuario.senhaHash);
    if (!ok) throw new UnauthorizedException('Senha atual incorreta');
    const hash = await bcrypt.hash(novaSenha, BCRYPT_COST_PROD);
    // Onda 2.3: incrementa tokenVersion para invalidar todos os JWTs
    // emitidos antes da troca de senha.
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      // tokenVersion: cast ate prisma generate atualizar o tipo (DLL travada
      // por instancia do app rodando localmente; coluna ja existe na migration).
      data: { senhaHash: hash, tokenVersion: { increment: 1 } },
    });
    return { ok: true };
  }

  /**
   * Onda 2.3: logout server-side. Incrementa tokenVersion para invalidar
   * o JWT atual (e quaisquer outros emitidos para o mesmo usuario).
   * Cliente deve descartar o token localmente; o backend nao tem mais
   * como aceita-lo.
   */
  async logout(usuarioId: string) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { tokenVersion: { increment: 1 } },
    });
    return { ok: true };
  }

  async requestPasswordReset(email: string, tenantId?: string) {
    // Tempo aproximadamente constante + resposta neutra para evitar enumeration de e-mails.
    const normalizedEmail = email.toLowerCase().trim();
    const matches = await this.prisma.usuario.findMany({
      where: { email: normalizedEmail, ...(tenantId ? { tenantId } : {}) },
      take: 2,
    });
    const usuario = !tenantId && matches.length > 1 ? null : matches[0];
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
      // F-005: envia token bruto por e-mail se SMTP estiver configurado.
      // O token bruto NUNCA é persistido nem logado em produção.
      if (usuario.tenantId) {
        const mailResult = await this.mailer.sendMail(usuario.tenantId, {
          to: usuario.email,
          subject: 'Recuperacao de Senha - Solution Ticket',
          text: `Voce solicitou a recuperacao de senha.\n\nToken: ${rawToken}\n\nEste token expira em 15 minutos.`,
          html: `<p>Voce solicitou a recuperacao de senha.</p><p><strong>Token:</strong> <code>${rawToken}</code></p><p>Este token expira em 15 minutos.</p>`,
        });
        if (!mailResult.ok) {
          this.logger.warn(`Falha ao enviar e-mail de recuperacao: ${mailResult.error}`);
        }
      }
    }
    return { ok: true };
  }

  async resetPassword(token: string, novaSenha: string) {
    validarPoliticaSenha(novaSenha);
    const tokenHash = hashResetToken(token);
    const reg = await this.prisma.tokenReset.findUnique({ where: { token: tokenHash } });
    if (!reg || reg.usado || reg.expiraEm < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }
    const hash = await bcrypt.hash(novaSenha, BCRYPT_COST_PROD);
    // Onda 2.3: incrementa tokenVersion ao resetar senha — invalida JWTs antigos.
    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: reg.usuarioId },
        data: { senhaHash: hash, tokenVersion: { increment: 1 } },
      }),
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

  /**
   * Gera token JWT de curta duração (60s) para uso em EventSource/SSE.
   * O token não carrega permissões completas, apenas scope 'sse' e tenantId.
   * RS3: reduz risco de vazamento do JWT principal em query strings e logs.
   */
  generateSseToken(usuario: AuthenticatedUser): string {
    return this.jwtService.sign(
      {
        sub: usuario.id,
        tenantId: usuario.tenantId,
        scope: 'sse',
        tv: usuario.tokenVersion ?? 0,
      },
      { expiresIn: '60s' },
    );
  }

  async validateSseToken(token: string): Promise<{ userId: string; tenantId: string }> {
    let payload: { sub?: string; tenantId?: string; scope?: string; tv?: number };
    try {
      payload = this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Token SSE invalido');
    }
    if (
      !payload.sub ||
      !payload.tenantId ||
      payload.scope !== 'sse' ||
      typeof payload.tv !== 'number'
    ) {
      throw new UnauthorizedException('Token SSE invalido');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: { ativo: true, tenantId: true, tokenVersion: true },
    });
    if (
      !usuario?.ativo ||
      usuario.tenantId !== payload.tenantId ||
      (usuario.tokenVersion ?? 0) !== payload.tv
    ) {
      throw new UnauthorizedException('Token SSE invalido');
    }
    return { userId: payload.sub, tenantId: payload.tenantId };
  }
}
