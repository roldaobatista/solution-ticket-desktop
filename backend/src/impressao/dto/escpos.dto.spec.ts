import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ImprimirEscposDto, SalvarEscposDto } from './escpos.dto';

describe('ESC/POS DTOs', () => {
  it('aceita portas fisicas conhecidas', async () => {
    for (const porta of ['COM3', 'LPT1', 'USB001', '/dev/usb/lp0', '/dev/ttyUSB0']) {
      const dto = plainToInstance(ImprimirEscposDto, { porta });
      await expect(validate(dto)).resolves.toHaveLength(0);
    }
  });

  it('rejeita caminho arbitrario como porta', async () => {
    const dto = plainToInstance(ImprimirEscposDto, { porta: 'C:\\temp\\ticket.bin' });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('rejeita nome de arquivo com diretorio', async () => {
    const dto = plainToInstance(SalvarEscposDto, { nome: '../ticket.bin' });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
