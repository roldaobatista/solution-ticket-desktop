import { NotImplementedException } from '@nestjs/common';
import { FilaService } from './fila.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FilaService', () => {
  function makeService() {
    return new FilaService({} as PrismaService);
  }

  it('mantem listagem neutra enquanto o modelo de fila nao existe', async () => {
    await expect(makeService().findByUnidade('unidade-1')).resolves.toEqual([]);
  });

  it.each([
    ['create', () => makeService().create({ veiculoId: 'v1' })],
    ['chamar', () => makeService().chamar('fila-1')],
    ['concluir', () => makeService().concluir('fila-1')],
    ['remove', () => makeService().remove('fila-1')],
  ])('falha explicitamente em %s enquanto o modelo de fila nao existe', async (_name, action) => {
    await expect(action()).rejects.toBeInstanceOf(NotImplementedException);
  });
});
