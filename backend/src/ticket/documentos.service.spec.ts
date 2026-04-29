import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { NotFoundException } from '@nestjs/common';
import { DocumentosService } from './documentos.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DocumentosService', () => {
  let tmpDir: string;
  let outsideFile: string;
  const prisma = {
    ticketPesagem: {
      findUnique: jest.fn(),
    },
    documentoPesagem: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solution-ticket-docs-'));
    process.env.APPDATA = tmpDir;
    outsideFile = path.join(tmpDir, 'fora-da-area.pdf');
    fs.writeFileSync(outsideFile, Buffer.from('%PDF-1.7\n'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function makeService() {
    return new DocumentosService(prisma as unknown as PrismaService);
  }

  it('bloqueia download quando caminho salvo aponta para fora da pasta de documentos', async () => {
    prisma.documentoPesagem.findUnique.mockResolvedValue({
      id: 'doc-1',
      arquivoUrl: outsideFile,
      ticket: { tenantId: 'tenant-1' },
    });

    await expect(makeService().download('doc-1', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('nao remove arquivo fisico fora da pasta de documentos', async () => {
    prisma.documentoPesagem.findUnique.mockResolvedValue({
      id: 'doc-1',
      arquivoUrl: outsideFile,
      ticket: { tenantId: 'tenant-1' },
    });

    await expect(makeService().remover('doc-1', 'tenant-1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(fs.existsSync(outsideFile)).toBe(true);
    expect(prisma.documentoPesagem.delete).not.toHaveBeenCalled();
  });
});
