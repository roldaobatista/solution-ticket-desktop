import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { getUserDataDir, getDatabasePath } from '../common/desktop-paths';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';
import { NotificacaoService } from '../mailer/notificacao.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

const DAILY_RETENTION = 30;
const MONTHLY_RETENTION = 12;
const HOURLY_RETENTION = 48;

export interface BackupInfo {
  filename: string;
  path: string;
  sizeBytes: number;
  sha256: string;
  createdAt: string;
  kind: 'hourly' | 'daily' | 'monthly' | 'manual';
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacao: NotificacaoService,
    private readonly auditoria?: AuditoriaService,
  ) {}

  private get backupsDir(): string {
    return path.join(getUserDataDir(), 'backups');
  }

  private get dailyDir(): string {
    return path.join(this.backupsDir, 'daily');
  }

  private get monthlyDir(): string {
    return path.join(this.backupsDir, 'monthly');
  }

  private get hourlyDir(): string {
    return path.join(this.backupsDir, 'hourly');
  }

  private ensureDirs() {
    fs.mkdirSync(this.hourlyDir, { recursive: true });
    fs.mkdirSync(this.dailyDir, { recursive: true });
    fs.mkdirSync(this.monthlyDir, { recursive: true });
  }

  /** Cron horário em produção para reduzir RPO quando o posto fecha antes das 23h. */
  @Cron('0 * * * *', { name: 'hourly-backup' })
  async hourlyBackup() {
    if (process.env.NODE_ENV !== 'production') return;
    try {
      const info = await this.create('hourly');
      this.logger.log(`Backup horário criado: ${info.filename} (${info.sizeBytes} bytes)`);
      this.applyRetention(this.hourlyDir, HOURLY_RETENTION);
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`Backup horário falhou: ${msg}`);
      await this.notificarFalhaBackup(msg);
    }
  }

  /** Cron diário às 23:00 — habilitado apenas em produção. */
  @Cron('0 23 * * *', { name: 'daily-backup' })
  async dailyBackup() {
    if (process.env.NODE_ENV !== 'production') return;
    try {
      const info = await this.create('daily');
      this.logger.log(`Backup diário criado: ${info.filename} (${info.sizeBytes} bytes)`);
      this.applyRetention(this.dailyDir, DAILY_RETENTION);

      // No primeiro dia do mês, copia para monthly/
      if (new Date().getDate() === 1) {
        const monthlyName = info.filename.replace('daily', 'monthly');
        fs.copyFileSync(info.path, path.join(this.monthlyDir, monthlyName));
        this.applyRetention(this.monthlyDir, MONTHLY_RETENTION);
      }
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`Backup diário falhou: ${msg}`);
      await this.notificarFalhaBackup(msg);
    }
  }

  private async notificarFalhaBackup(mensagem: string) {
    try {
      const tenants = await this.notificacao.listarTenantsComAlertaBackup();
      for (const tenantId of tenants) {
        await this.notificacao.notificar(tenantId, {
          evento: 'falha_backup',
          assunto: '[Solution Ticket] Falha no backup automatico',
          texto: `O backup diario nao pode ser concluido.\n\nDetalhes: ${mensagem}`,
          html: `<p>O backup diario nao pode ser concluido.</p><p><strong>Detalhes:</strong> ${mensagem}</p>`,
          dados: { mensagem, momento: new Date().toISOString() },
        });
      }
    } catch (err) {
      this.logger.warn(`Falha ao notificar erro de backup: ${(err as Error).message}`);
    }
  }

  /** Cria backup do banco SQLite atual. SHA-256 + integridade verificados. */
  async create(kind: BackupInfo['kind'] = 'manual'): Promise<BackupInfo> {
    this.ensureDirs();
    const dbPath = getDatabasePath();
    if (!fs.existsSync(dbPath)) {
      throw new NotFoundException(`Banco não encontrado em ${dbPath}`);
    }

    // PRAGMA wal_checkpoint para garantir que dados em WAL estejam no .db
    try {
      await this.prisma.$executeRawUnsafe('PRAGMA wal_checkpoint(TRUNCATE);');
    } catch (err) {
      const message = `wal_checkpoint falhou: ${(err as Error).message}`;
      this.logger.warn(message);
      throw new BadRequestException(message);
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `solution-ticket-${kind}-${ts}.db`;
    const dir =
      kind === 'daily'
        ? this.dailyDir
        : kind === 'monthly'
          ? this.monthlyDir
          : kind === 'hourly'
            ? this.hourlyDir
            : this.backupsDir;
    const dest = path.join(dir, filename);

    fs.copyFileSync(dbPath, dest);
    const assetsDir = `${dest}.assets`;
    const manifest = await this.copyEvidenceAssets(assetsDir);
    const sha256 = await this.hashFile(dest);
    fs.writeFileSync(`${dest}.sha256`, sha256);
    fs.writeFileSync(
      `${dest}.manifest.json`,
      JSON.stringify({ database: filename, assets: manifest }, null, 2),
    );

    const stat = fs.statSync(dest);
    return {
      filename,
      path: dest,
      sizeBytes: stat.size,
      sha256,
      createdAt: new Date().toISOString(),
      kind,
    };
  }

  /** Lista backups existentes (daily + monthly + manual). */
  list(): BackupInfo[] {
    this.ensureDirs();
    const result: BackupInfo[] = [];
    const dirs: Array<[string, BackupInfo['kind']]> = [
      [this.hourlyDir, 'hourly'],
      [this.dailyDir, 'daily'],
      [this.monthlyDir, 'monthly'],
      [this.backupsDir, 'manual'],
    ];
    for (const [dir, kind] of dirs) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith('.db')) continue;
        const p = path.join(dir, f);
        const stat = fs.statSync(p);
        if (!stat.isFile()) continue;
        const shaPath = `${p}.sha256`;
        const sha256 = fs.existsSync(shaPath) ? fs.readFileSync(shaPath, 'utf8').trim() : '';
        result.push({
          filename: f,
          path: p,
          sizeBytes: stat.size,
          sha256,
          createdAt: stat.mtime.toISOString(),
          kind,
        });
      }
    }
    return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  /** Valida que filename é basename puro (sem separadores nem ..) e resolve dentro de backupsDir. */
  private assertSafeBackupFilename(filename: string): void {
    if (!filename || typeof filename !== 'string') {
      throw new BadRequestException('filename inválido');
    }
    if (filename !== path.basename(filename) || filename.includes('..')) {
      throw new BadRequestException('filename inválido (path traversal)');
    }
    if (!/^[A-Za-z0-9._-]+\.db$/.test(filename)) {
      throw new BadRequestException('filename inválido (caracteres não permitidos)');
    }
  }

  /**
   * Restaura um backup. Operação destrutiva: cria backup pré-restore,
   * substitui o .db atual e força reinício (cliente precisa reconectar).
   */
  async restore(
    filename: string,
    auditContext?: { tenantId?: string; usuarioId?: string },
  ): Promise<{ ok: true; preRestoreBackup: string }> {
    this.assertSafeBackupFilename(filename);
    const all = this.list();
    const target = all.find((b) => b.filename === filename);
    if (!target) throw new NotFoundException(`Backup ${filename} não encontrado`);

    // Defesa em profundidade: garante que path resolvido está dentro de backupsDir
    const resolvedTarget = path.resolve(target.path);
    const resolvedRoot = path.resolve(this.backupsDir);
    if (!resolvedTarget.startsWith(resolvedRoot + path.sep)) {
      throw new BadRequestException('path do backup fora do diretório permitido');
    }

    // Verifica integridade antes de restaurar
    const expected = target.sha256;
    if (expected) {
      const actual = await this.hashFile(target.path);
      if (actual !== expected) {
        throw new BadRequestException(
          `Checksum inválido para ${filename}. Backup corrompido — restauração abortada.`,
        );
      }
    }

    // Salva estado atual antes de sobrescrever
    const pre = await this.create('manual');
    this.logger.warn(`Restore: backup pré-restore em ${pre.filename}`);
    if (this.auditoria && auditContext?.tenantId) {
      await this.auditoria.registrar({
        entidade: 'backup',
        entidadeId: filename,
        evento: 'restore.requested',
        usuarioId: auditContext.usuarioId,
        tenantId: auditContext.tenantId,
        estadoNovo: {
          filename,
          sha256: target.sha256 || null,
          preRestoreBackup: pre.filename,
          preRestoreSha256: pre.sha256,
        },
      });
    }

    await this.prisma.$disconnect();
    const dbPath = getDatabasePath();
    this.removeSqliteSidecars(dbPath);
    fs.copyFileSync(target.path, dbPath);
    this.restoreEvidenceAssets(`${target.path}.assets`);
    this.removeSqliteSidecars(dbPath);
    this.logger.warn(`Restore concluído de ${filename}. Encerrando processo para reinicio limpo.`);
    setTimeout(() => process.exit(99), 250);
    return { ok: true, preRestoreBackup: pre.filename };
  }

  /** Aplica integrity_check do SQLite no backup informado. */
  async verify(filename: string): Promise<{ ok: boolean; details: string }> {
    this.assertSafeBackupFilename(filename);
    const target = this.list().find((b) => b.filename === filename);
    if (!target) throw new NotFoundException(`Backup ${filename} não encontrado`);

    if (target.sha256) {
      const actual = await this.hashFile(target.path);
      if (actual !== target.sha256) {
        return { ok: false, details: 'sha256 divergente' };
      }
    }

    // F-016: PRAGMA integrity_check em cópia temporária
    const tempPath = `${target.path}.integrity-check.tmp`;
    try {
      fs.copyFileSync(target.path, tempPath);
      const tempDb = new PrismaClient({
        datasourceUrl: `file:${tempPath}`,
      });
      const result = (await tempDb.$queryRawUnsafe('PRAGMA integrity_check;')) as Array<{
        integrity_check: string;
      }>;
      await tempDb.$disconnect();
      const check = result?.[0]?.integrity_check;
      if (check !== 'ok') {
        return { ok: false, details: `integrity_check falhou: ${check}` };
      }
      return { ok: true, details: 'sha256 ok + integrity_check ok' };
    } catch (err) {
      this.logger.error(`integrity_check erro: ${(err as Error).message}`);
      return { ok: false, details: `integrity_check erro: ${(err as Error).message}` };
    } finally {
      try {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      } catch {}
    }
  }

  private hashFile(p: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = fs.createReadStream(p);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private evidenceRoots(): Array<{ name: string; dir: string }> {
    const appdata =
      process.env.APPDATA ||
      path.join(process.env.USERPROFILE || process.env.HOME || '.', 'AppData', 'Roaming');
    return [
      { name: 'fotos', dir: path.join(getUserDataDir(), 'fotos') },
      { name: 'assinaturas', dir: path.join(getUserDataDir(), 'assinaturas') },
      { name: 'documentos', dir: path.join(appdata, 'SolutionTicket', 'docs') },
    ];
  }

  private async copyEvidenceAssets(destRoot: string) {
    const manifest: Array<{ name: string; files: number }> = [];
    for (const root of this.evidenceRoots()) {
      if (!fs.existsSync(root.dir)) {
        manifest.push({ name: root.name, files: 0 });
        continue;
      }
      const dest = path.join(destRoot, root.name);
      const files = this.copyDirRecursive(root.dir, dest);
      manifest.push({ name: root.name, files });
    }
    return manifest;
  }

  private restoreEvidenceAssets(srcRoot: string) {
    if (!fs.existsSync(srcRoot)) return;
    for (const root of this.evidenceRoots()) {
      const src = path.join(srcRoot, root.name);
      if (!fs.existsSync(src)) continue;
      this.copyDirRecursive(src, root.dir);
    }
  }

  private copyDirRecursive(src: string, dest: string): number {
    fs.mkdirSync(dest, { recursive: true });
    let count = 0;
    for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
      const from = path.join(src, entry.name);
      const to = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        count += this.copyDirRecursive(from, to);
      } else if (entry.isFile()) {
        fs.copyFileSync(from, to);
        count += 1;
      }
    }
    return count;
  }

  private removeSqliteSidecars(dbPath: string): void {
    for (const suffix of ['-wal', '-shm']) {
      const sidecar = `${dbPath}${suffix}`;
      if (fs.existsSync(sidecar)) {
        fs.unlinkSync(sidecar);
      }
    }
  }

  /** Mantém apenas os N mais recentes. Remove o resto + seu .sha256. */
  private applyRetention(dir: string, keep: number) {
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => ({ f, mtime: fs.statSync(path.join(dir, f)).mtime.getTime() }))
      .sort((a, b) => b.mtime - a.mtime);

    const toRemove = files.slice(keep);
    for (const { f } of toRemove) {
      const full = path.join(dir, f);
      try {
        fs.unlinkSync(full);
        if (fs.existsSync(`${full}.sha256`)) fs.unlinkSync(`${full}.sha256`);
        if (fs.existsSync(`${full}.manifest.json`)) fs.unlinkSync(`${full}.manifest.json`);
        fs.rmSync(`${full}.assets`, { recursive: true, force: true });
        this.logger.log(`Backup antigo removido: ${f}`);
      } catch (err) {
        this.logger.warn(`Falha removendo ${f}: ${(err as Error).message}`);
      }
    }
  }
}
