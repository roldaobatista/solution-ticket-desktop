import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { EscposPrinterService } from './escpos-printer.service';

describe('EscposPrinterService', () => {
  let service: EscposPrinterService;

  beforeEach(() => {
    service = new EscposPrinterService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('rejeita caminho arbitrario como porta de impressao', async () => {
    const portaInvalida = os.platform() === 'win32' ? 'C:\\temp\\ticket.bin' : '/tmp/ticket.bin';

    await expect(service.imprimir(Buffer.from('ticket'), portaInvalida)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejeita path traversal ao salvar arquivo ESC/POS', () => {
    expect(() => service.salvarParaArquivo(Buffer.from('ticket'), '../ticket.bin')).toThrow(
      BadRequestException,
    );
    expect(() => service.salvarParaArquivo(Buffer.from('ticket'), '..\\ticket.bin')).toThrow(
      BadRequestException,
    );
  });

  it('salva somente dentro do diretorio temporario controlado', () => {
    const nome = `ticket-test-${Date.now()}.bin`;
    const arquivo = service.salvarParaArquivo(Buffer.from('ticket'), nome);
    const tmpDir = path.resolve(path.join(os.tmpdir(), 'solution-ticket-escpos'));

    try {
      expect(path.dirname(arquivo)).toBe(tmpDir);
      expect(fs.existsSync(arquivo)).toBe(true);
    } finally {
      if (fs.existsSync(arquivo)) fs.unlinkSync(arquivo);
    }
  });
});
