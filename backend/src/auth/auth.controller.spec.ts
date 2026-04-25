import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockAuthService = {
    login: jest.fn(),
    validateUser: jest.fn(),
    changePassword: jest.fn(),
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve retornar token a partir do usuário no request', async () => {
      const user = { id: 'u1', email: 'a@b.com', tenantId: 't1' };
      const token = {
        accessToken: 'tok',
        usuario: { id: 'u1', email: 'a@b.com', tenantId: 't1', perfis: [] },
      };
      authService.login.mockResolvedValue(token as any);

      const result = await controller.login({ user } as any);

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(token);
    });
  });

  describe('loginDirect', () => {
    it('deve fazer login direto com credenciais válidas', async () => {
      const dto = { email: 'a@b.com', senha: '123' };
      const user = { id: 'u1', email: 'a@b.com' };
      const token = {
        accessToken: 'tok',
        usuario: { id: 'u1', email: 'a@b.com', tenantId: null, perfis: [] },
      };
      authService.validateUser.mockResolvedValue(user as any);
      authService.login.mockResolvedValue(token as any);

      const result = await controller.loginDirect(dto);

      expect(authService.validateUser).toHaveBeenCalledWith(dto.email, dto.senha);
      expect(authService.login).toHaveBeenCalledWith(user);
      expect(result).toEqual(token);
    });

    it('deve lançar UnauthorizedException se credenciais inválidas', async () => {
      authService.validateUser.mockResolvedValue(null as any);

      await expect(controller.loginDirect({ email: 'x', senha: 'y' })).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('me', () => {
    it('deve retornar usuário do request', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      const result = await controller.me({ user } as any);
      expect(result).toEqual(user);
    });
  });

  describe('changePassword', () => {
    it('deve trocar senha com user.id', async () => {
      const user = { id: 'u1', email: 'a@b.com' };
      authService.changePassword.mockResolvedValue({ ok: true } as any);

      const result = await controller.changePassword({ user } as any, {
        senhaAtual: 'old',
        novaSenha: 'new',
      });

      expect(authService.changePassword).toHaveBeenCalledWith('u1', 'old', 'new');
      expect(result).toEqual({ ok: true });
    });

    it('deve usar sub como fallback se id ausente', async () => {
      const user = { sub: 'u2', email: 'a@b.com' };
      authService.changePassword.mockResolvedValue({ ok: true } as any);

      await controller.changePassword({ user } as any, {
        senhaAtual: 'old',
        novaSenha: 'new',
      });

      expect(authService.changePassword).toHaveBeenCalledWith('u2', 'old', 'new');
    });

    it('deve lançar UnauthorizedException se não há id nem sub', async () => {
      const user = { email: 'a@b.com' };
      await expect(
        controller.changePassword({ user } as any, { senhaAtual: 'old', novaSenha: 'new' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('requestPasswordReset', () => {
    it('deve solicitar reset de senha', async () => {
      authService.requestPasswordReset.mockResolvedValue({ ok: true } as any);
      const result = await controller.requestPasswordReset({ email: 'a@b.com' });
      expect(authService.requestPasswordReset).toHaveBeenCalledWith('a@b.com');
      expect(result).toEqual({ ok: true });
    });
  });

  describe('resetPassword', () => {
    it('deve resetar senha com token', async () => {
      authService.resetPassword.mockResolvedValue({ ok: true } as any);
      const result = await controller.resetPassword({ token: 'tok', novaSenha: 'new' });
      expect(authService.resetPassword).toHaveBeenCalledWith('tok', 'new');
      expect(result).toEqual({ ok: true });
    });
  });
});
