import { BadRequestException } from '@nestjs/common';
import { BackupService } from './backup.service';

describe('BackupService — assertSafeBackupFilename (S0.1)', () => {
  const service = new BackupService({} as never);
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
