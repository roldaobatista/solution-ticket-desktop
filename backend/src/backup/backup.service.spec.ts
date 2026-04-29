import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { BackupService } from './backup.service';

describe('BackupService — assertSafeBackupFilename (S0.1)', () => {
  const service = new BackupService({} as never, {} as never);
  const assertSafe = (f: string) =>
    (
      service as unknown as { assertSafeBackupFilename: (f: string) => void }
    ).assertSafeBackupFilename(f);

  it.each([
    '../../etc/passwd',
    '..\\..\\windows\\system32\\config\\sam',
    '/absolute/path.db',
    'C:\\absolute\\path.db',
    'foo/bar.db',
    'foo\\bar.db',
    'evil..db',
    'no-extension',
    'spaces in name.db',
    'with;semicolon.db',
    '',
  ])('rejeita filename inseguro: %s', (filename) => {
    expect(() => assertSafe(filename)).toThrow(BadRequestException);
  });

  it.each([
    'solution-ticket-daily-2026-04-25.db',
    'solution-ticket-monthly-2026-01-01T00-00-00-000Z.db',
    'backup_001.db',
    'a.db',
  ])('aceita filename canônico: %s', (filename) => {
    expect(() => assertSafe(filename)).not.toThrow();
  });
});

describe('BackupService — WAL safety', () => {
  const originalUserData = process.env.USER_DATA_PATH;
  let tmpDir: string;
  let prisma: { $executeRawUnsafe: jest.Mock; $disconnect: jest.Mock };
  let service: BackupService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'solution-ticket-backup-'));
    process.env.USER_DATA_PATH = tmpDir;
    fs.writeFileSync(path.join(tmpDir, 'solution-ticket.db'), 'db-atual');
    prisma = {
      $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
    };
    service = new BackupService(prisma as never, {} as never);
  });

  afterEach(() => {
    if (originalUserData === undefined) delete process.env.USER_DATA_PATH;
    else process.env.USER_DATA_PATH = originalUserData;
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.restoreAllMocks();
  });

  it('aborta backup quando wal_checkpoint falha', async () => {
    prisma.$executeRawUnsafe.mockRejectedValue(new Error('database is locked'));

    await expect(service.create('manual')).rejects.toThrow(/wal_checkpoint falhou/);

    const backupsDir = path.join(tmpDir, 'backups');
    const backups = fs.existsSync(backupsDir)
      ? fs.readdirSync(backupsDir).filter((f) => f.endsWith('.db'))
      : [];
    expect(backups).toHaveLength(0);
  });

  it('remove WAL e SHM antigos antes de finalizar restore', async () => {
    const backupsDir = path.join(tmpDir, 'backups');
    fs.mkdirSync(backupsDir, { recursive: true });
    const backupPath = path.join(backupsDir, 'restore-target.db');
    fs.writeFileSync(backupPath, 'db-restaurado');
    fs.writeFileSync(`${backupPath}.sha256`, await (service as any).hashFile(backupPath));
    fs.writeFileSync(path.join(tmpDir, 'solution-ticket.db-wal'), 'wal-antigo');
    fs.writeFileSync(path.join(tmpDir, 'solution-ticket.db-shm'), 'shm-antigo');
    jest.spyOn(global, 'setTimeout').mockImplementation((() => 0) as never);

    await service.restore('restore-target.db');

    expect(fs.readFileSync(path.join(tmpDir, 'solution-ticket.db'), 'utf8')).toBe('db-restaurado');
    expect(fs.existsSync(path.join(tmpDir, 'solution-ticket.db-wal'))).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, 'solution-ticket.db-shm'))).toBe(false);
  });
});
