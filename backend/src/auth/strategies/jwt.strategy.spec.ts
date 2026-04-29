import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  function makeStrategy(usuario: {
    id: string;
    email: string;
    nome: string;
    tenantId: string;
    ativo: boolean;
    tokenVersion: number;
    perfis: unknown[];
  }) {
    process.env.JWT_SECRET = 's'.repeat(48);
    return new JwtStrategy({
      usuario: {
        findUnique: jest.fn().mockResolvedValue(usuario),
      },
      unidade: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'un1',
          nome: 'Unidade Matriz',
          cidade: 'Campo Grande',
          uf: 'MS',
        }),
      },
    } as never);
  }

  it('usa tenantId atual do banco em vez do claim do token', async () => {
    const strategy = makeStrategy({
      id: 'u1',
      email: 'user@example.com',
      nome: 'User',
      tenantId: 'tenant-banco',
      ativo: true,
      tokenVersion: 0,
      perfis: [],
    });

    await expect(
      strategy.validate({
        sub: 'u1',
        email: 'claim@example.com',
        nome: 'Claim',
        tenantId: 'tenant-token',
        tv: 0,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('retorna identidade atual do banco quando tenant do token confere', async () => {
    const strategy = makeStrategy({
      id: 'u1',
      email: 'atual@example.com',
      nome: 'Atual',
      tenantId: 'tenant-1',
      ativo: true,
      tokenVersion: 0,
      perfis: [],
    });

    await expect(
      strategy.validate({
        sub: 'u1',
        email: 'antigo@example.com',
        nome: 'Antigo',
        tenantId: 'tenant-1',
        tv: 0,
      }),
    ).resolves.toMatchObject({
      id: 'u1',
      email: 'atual@example.com',
      nome: 'Atual',
      tenantId: 'tenant-1',
      unidadeId: 'un1',
      unidadeNome: 'Unidade Matriz',
    });
  });
});
