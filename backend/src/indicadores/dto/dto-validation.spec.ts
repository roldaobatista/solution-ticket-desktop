import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateIndicadorDto } from './create-indicador.dto';
import { UpdateIndicadorDto } from './update-indicador.dto';

describe('DTO validations — indicadores', () => {
  it('valida indicador customizado com comando de leitura', async () => {
    const dto = plainToInstance(CreateIndicadorDto, {
      descricao: 'Toledo C custom',
      fabricante: 'Toledo',
      modelo: 'C',
      protocolo: 'serial',
      parserTipo: 'toledo-c',
      baudrate: 4800,
      databits: 7,
      parity: 'E',
      stopbits: 2,
      flowControl: 'NONE',
      readMode: 'polling',
      readCommandHex: '05',
      readIntervalMs: 500,
      readTimeoutMs: 2000,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('permite null em update para limpar campos opcionais', async () => {
    const dto = plainToInstance(UpdateIndicadorDto, {
      fabricante: null,
      modelo: null,
      parserTipo: null,
      readCommandHex: null,
      readIntervalMs: null,
      readTimeoutMs: null,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejeita campos desconhecidos com whitelist do ValidationPipe global', async () => {
    const dto = plainToInstance(CreateIndicadorDto, {
      descricao: 'Indicador',
      campoIntruso: true,
    });

    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.some((e) => e.property === 'campoIntruso')).toBe(true);
  });
});
