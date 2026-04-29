import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    usuario: {
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    unidade: { findFirst: jest.Mock };
    permissao: { findMany: jest.Mock };
    tokenReset: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let jwt: JwtService;

  beforeEach(async () => {
    prisma = {
      usuario: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      unidade: { findFirst: jest.fn().mockResolvedValue(null) },
      permissao: { findMany: jest.fn().mockResolvedValue([]) },
      tokenReset: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('token-fake'),
            verify: jest.fn(),
          },
        },
        {
          provide: MailerService,
          useValue: { sendMail: jest.fn().mockResolvedValue({ ok: true }) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    jwt = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('valida credenciais corretas e reseta tentativas', async () => {
      const senhaHash = await bcrypt.hash('senha123', 4);
      prisma.usuario.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'a@b.com',
          senhaHash,
          ativo: true,
          bloqueadoAte: null,
          perfis: [],
        },
      ]);

      const user = await service.validateUser('a@b.com', 'senha123');
      expect(user).toBeDefined();
      expect((user as { senhaHash?: string }).senhaHash).toBeUndefined();
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tentativasLogin: 0 }) }),
      );
    });

    it('rejeita usuário inexistente', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);
      await expect(service.validateUser('x@x.com', 'a')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita usuário inativo', async () => {
      prisma.usuario.findMany.mockResolvedValue([
        {
          id: 'u1',
          senhaHash: 'x',
          ativo: false,
          bloqueadoAte: null,
          perfis: [],
        },
      ]);
      await expect(service.validateUser('a@b.com', 'x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita conta bloqueada', async () => {
      const futuro = new Date(Date.now() + 60_000);
      prisma.usuario.findMany.mockResolvedValue([
        {
          id: 'u1',
          senhaHash: 'x',
          ativo: true,
          bloqueadoAte: futuro,
          perfis: [],
        },
      ]);
      await expect(service.validateUser('a@b.com', 'x')).rejects.toThrow(/credenciais/i);
    });

    it('incrementa tentativas quando senha inválida', async () => {
      const senhaHash = await bcrypt.hash('certa', 4);
      prisma.usuario.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'a@b.com',
          senhaHash,
          ativo: true,
          bloqueadoAte: null,
          tentativasLogin: 2,
          perfis: [],
        },
      ]);
      await expect(service.validateUser('a@b.com', 'errada')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      // Onda 2.2: bloqueio progressivo. Tentativa 3 ainda nao bloqueia
      // (limite e 5); valor atualizado e 3.
      expect(prisma.usuario.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tentativasLogin: 3 }),
        }),
      );
    });

    it('aplica bloqueadoAte ao atingir 5 tentativas (Onda 2.2)', async () => {
      const senhaHash = await bcrypt.hash('certa', 4);
      prisma.usuario.findMany.mockResolvedValue([
        {
          id: 'u1',
          email: 'a@b.com',
          senhaHash,
          ativo: true,
          bloqueadoAte: null,
          tentativasLogin: 4, // proxima tentativa atinge o limite
          perfis: [],
        },
      ]);
      await expect(service.validateUser('a@b.com', 'errada')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      const callArgs = prisma.usuario.update.mock.calls[0][0];
      expect(callArgs.data.bloqueadoAte).toBeInstanceOf(Date);
      expect(callArgs.data.tentativasLogin).toBe(0); // reseta apos bloquear
    });
  });

  describe('requestPasswordReset', () => {
    it('retorna ok=true sem revelar se e-mail existe (enumeration)', async () => {
      prisma.usuario.findMany.mockResolvedValue([]);
      const r = await service.requestPasswordReset('inexistente@x.com');
      expect(r).toEqual({ ok: true });
      expect(prisma.tokenReset.create).not.toHaveBeenCalled();
    });

    it('persiste apenas o HASH do token, nunca o token bruto', async () => {
      prisma.usuario.findMany.mockResolvedValue([{ id: 'u1', email: 'a@b.com', tenantId: 't1' }]);
      await service.requestPasswordReset('a@b.com');
      expect(prisma.tokenReset.create).toHaveBeenCalledTimes(1);
      const createArg = prisma.tokenReset.create.mock.calls[0][0];
      const tokenStored: string = createArg.data.token;
      // SHA-256 hex = 64 chars
      expect(tokenStored).toMatch(/^[a-f0-9]{64}$/);
    });

    it('seta expiraEm ~15 minutos no futuro', async () => {
      prisma.usuario.findMany.mockResolvedValue([{ id: 'u1', email: 'a@b.com', tenantId: 't1' }]);
      const antes = Date.now();
      await service.requestPasswordReset('a@b.com');
      const { expiraEm } = prisma.tokenReset.create.mock.calls[0][0].data;
      const delta = expiraEm.getTime() - antes;
      expect(delta).toBeGreaterThan(14 * 60_000);
      expect(delta).toBeLessThan(16 * 60_000);
    });
  });

  describe('resetPassword', () => {
    // Onda 2.7: politica subiu para 10 caracteres minimos + letra + numero.
    it('rejeita senha sem 10+ chars + letra + numero', async () => {
      await expect(service.resetPassword('any', '123456789')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      await expect(service.resetPassword('any', 'soletraslongas')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('rejeita token inexistente / usado / expirado', async () => {
      prisma.tokenReset.findUnique.mockResolvedValue(null);
      await expect(service.resetPassword('xxx', 'senhaForte10')).rejects.toThrow(/inválido/i);

      prisma.tokenReset.findUnique.mockResolvedValue({
        id: 't1',
        usuarioId: 'u1',
        usado: true,
        expiraEm: new Date(Date.now() + 60_000),
      });
      await expect(service.resetPassword('xxx', 'senhaForte10')).rejects.toThrow(/inválido/i);

      prisma.tokenReset.findUnique.mockResolvedValue({
        id: 't1',
        usuarioId: 'u1',
        usado: false,
        expiraEm: new Date(Date.now() - 60_000),
      });
      await expect(service.resetPassword('xxx', 'senhaForte10')).rejects.toThrow(/expirado/i);
    });

    it('reseta senha quando token válido, marcando como usado', async () => {
      prisma.tokenReset.findUnique.mockResolvedValue({
        id: 't1',
        usuarioId: 'u1',
        usado: false,
        expiraEm: new Date(Date.now() + 60_000),
      });
      const r = await service.resetPassword('rawtoken', 'novaSenhaForte10');
      expect(r).toEqual({ ok: true });
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('gera accessToken com payload esperado', async () => {
      prisma.unidade.findFirst.mockResolvedValue({
        id: 'u1',
        nome: 'Unidade Matriz',
        cidade: 'Campo Grande',
        uf: 'MS',
      });

      const res = await service.login({
        id: 'u1',
        email: 'a@b.com',
        nome: 'A',
        tenantId: 't1',
        perfis: [],
      });
      expect(res.accessToken).toBe('token-fake');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ sub: 'u1', email: 'a@b.com', tenantId: 't1' }),
      );
      expect(res.usuario.id).toBe('u1');
      expect(res.usuario.unidadeId).toBe('u1');
      expect(res.usuario.unidadeNome).toBe('Unidade Matriz');
    });
  });

  describe('validateSseToken', () => {
    it('rejeita token SSE emitido antes da versao atual do usuario', async () => {
      (jwt.verify as jest.Mock).mockReturnValue({
        sub: 'u1',
        tenantId: 't1',
        scope: 'sse',
        tv: 1,
      });
      prisma.usuario.findUnique.mockResolvedValue({
        ativo: true,
        tenantId: 't1',
        tokenVersion: 2,
      });

      await expect(service.validateSseToken('sse-token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });
});
