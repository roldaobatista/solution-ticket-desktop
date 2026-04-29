import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

type MockFn = jest.Mock;

interface UsersPrismaMock {
  usuario: {
    findFirst: MockFn;
    create: MockFn;
    findMany: MockFn;
    count: MockFn;
    update: MockFn;
  };
  usuarioPerfil: {
    createMany: MockFn;
    deleteMany: MockFn;
  };
  perfil: {
    count: MockFn;
  };
}

describe('UsersService', () => {
  let prisma: UsersPrismaMock;
  let service: UsersService;

  beforeEach(() => {
    prisma = {
      usuario: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-1',
          nome: 'Operador',
          email: 'operador@example.com',
          ativo: true,
          ultimoAcesso: null,
          criadoEm: new Date(),
          atualizadoEm: new Date(),
          perfis: [],
        }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
        update: jest.fn().mockResolvedValue({ id: 'user-1' }),
      },
      usuarioPerfil: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      perfil: {
        count: jest.fn().mockResolvedValue(0),
      },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  it('rejeita perfilIds que nao pertencem ao tenant do usuario criado', async () => {
    prisma.perfil.count.mockResolvedValue(1);

    await expect(
      service.create(
        {
          nome: 'Operador',
          email: 'operador@example.com',
          senha: 'SenhaSegura123',
          perfilIds: ['perfil-tenant-a', 'perfil-tenant-b'],
        },
        'tenant-a',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.usuario.create).not.toHaveBeenCalled();
    expect(prisma.usuarioPerfil.createMany).not.toHaveBeenCalled();
  });

  it('aplica politica de senha na criacao administrativa', async () => {
    await expect(
      service.create(
        {
          nome: 'Operador',
          email: 'operador@example.com',
          senha: '123',
        },
        'tenant-a',
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.usuario.create).not.toHaveBeenCalled();
  });

  it('revoga tokens ao alterar senha administrativamente', async () => {
    prisma.usuario.findFirst.mockResolvedValueOnce({ id: 'user-1', tenantId: 'tenant-a' });

    await service.update('user-1', { senha: 'SenhaNova123' }, 'tenant-a');

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senhaHash: expect.any(String),
          tokenVersion: { increment: 1 },
        }),
      }),
    );
  });
});
