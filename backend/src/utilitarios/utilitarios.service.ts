import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { LicencaService } from '../licenca/licenca.service';
import { obterFingerprint } from '../licenca/fingerprint.util';

@Injectable()
export class UtilitariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly licencaService: LicencaService,
  ) {}

  async diagnostico() {
    const sistema = {
      node: process.version,
      electron: (process.versions as any).electron || null,
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      ram: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
      ramLivre: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
      uptimeS: Math.round(process.uptime()),
      platform: process.platform,
    };

    const banco = await this.inspecionarBanco();
    const licenca = await this.inspecionarLicenca();

    return { sistema, banco, licenca, geradoEm: new Date().toISOString() };
  }

  private async inspecionarBanco() {
    try {
      const url = process.env.DATABASE_URL || '';
      let caminho = '';
      if (url.startsWith('file:')) {
        caminho = url.replace(/^file:/, '');
      }
      if (caminho && !path.isAbsolute(caminho)) {
        caminho = path.resolve(process.cwd(), caminho);
      }
      let tamanhoKb = 0;
      let ultimaEscritaIso: string | null = null;
      if (caminho && fs.existsSync(caminho)) {
        const stat = fs.statSync(caminho);
        tamanhoKb = Math.round(stat.size / 1024);
        ultimaEscritaIso = stat.mtime.toISOString();
      }
      return { caminho: caminho || '(config por DATABASE_URL)', tamanhoKb, ultimaEscritaIso };
    } catch (err: any) {
      return { caminho: null, tamanhoKb: 0, ultimaEscritaIso: null, erro: err?.message };
    }
  }

  private async inspecionarLicenca() {
    try {
      const fingerprint = obterFingerprint();
      const licenca = await (this.prisma as any).licencaInstalacao?.findFirst?.({
        where: { fingerprintDispositivo: fingerprint },
        orderBy: { createdAt: 'desc' },
      });
      if (!licenca) {
        return { status: 'SEM_LICENCA', fingerprint, diasRestantes: null };
      }
      let diasRestantes: number | null = null;
      const validade = (licenca as any).dataValidade || (licenca as any).validade || null;
      if (validade) {
        const ms = new Date(validade).getTime() - Date.now();
        diasRestantes = Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
      }
      return {
        status: (licenca as any).statusLicenca || 'DESCONHECIDO',
        fingerprint,
        diasRestantes,
        unidadeId: (licenca as any).unidadeId,
      };
    } catch (err: any) {
      return { status: 'ERRO', erro: err?.message, fingerprint: null, diasRestantes: null };
    }
  }

  async logsRecentes(n: number = 50) {
    try {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      const logPath = path.join(appData, '@solution-ticket', 'electron', 'logs', 'electron.log');
      if (!fs.existsSync(logPath)) {
        return { caminho: logPath, existe: false, linhas: [] };
      }
      const raw = fs.readFileSync(logPath, 'utf-8');
      const linhas = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const tail = linhas.slice(-Math.max(1, n));
      return { caminho: logPath, existe: true, linhas: tail };
    } catch (err: any) {
      return { caminho: null, existe: false, linhas: [], erro: err?.message };
    }
  }
}
