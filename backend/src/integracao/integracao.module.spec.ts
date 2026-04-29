import { Test } from '@nestjs/testing';
import { IntegracaoModule } from './integracao.module';
import { IntegracaoController } from './integracao.controller';

describe('IntegracaoModule', () => {
  it('compila o modulo isolado', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [IntegracaoModule],
    }).compile();

    expect(moduleRef.get(IntegracaoController)).toBeDefined();
  });
});
