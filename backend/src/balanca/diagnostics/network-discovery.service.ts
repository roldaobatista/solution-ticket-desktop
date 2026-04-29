import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'net';
import * as os from 'os';

/**
 * Portas TCP comuns em conversores serial-Ethernet usados com balanças:
 *  - 4001 (USR-TCP232, MOXA NPort default)
 *  - 9999 (Lantronix XPort)
 *  - 23   (telnet, alguns indicadores antigos)
 *  - 8000 (Saturno via USR-TCP232 customizado)
 *  - 10001 (Lantronix variável)
 */
const PORTAS_PERMITIDAS = [23, 502, 4001, 8000, 9999, 10001];
const PORTAS_PADRAO = [4001, 9999, 23, 8000, 10001];

function isPrivatePrefix(prefix: string): boolean {
  const parts = prefix.split('.').map(Number);
  if (parts.length !== 3 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
    return false;
  }
  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
}

export interface DispositivoEncontrado {
  ip: string;
  porta: number;
  rttMs: number;
}

@Injectable()
export class NetworkDiscoveryService {
  private readonly logger = new Logger(NetworkDiscoveryService.name);

  /**
   * Faz scan de IPs no segmento /24 do host (192.168.x.1-254) testando
   * portas TCP comuns. Retorna apenas hosts que aceitaram conexão.
   * Cuidado: gera tráfego — limitar a redes próprias.
   */
  async scan(
    opts: {
      cidr?: string; // ex: '192.168.1' (faz 192.168.1.1..254)
      portas?: number[];
      timeoutMs?: number;
      paralelo?: number;
    } = {},
  ): Promise<DispositivoEncontrado[]> {
    const portas = (opts.portas ?? PORTAS_PADRAO).filter((p) => PORTAS_PERMITIDAS.includes(p));
    if (portas.length === 0) return [];
    const timeout = opts.timeoutMs ?? 800;
    const paralelo = Math.min(opts.paralelo ?? 32, 64);
    const prefix = opts.cidr ?? this.detectarPrefixoLocal();

    if (!prefix || !isPrivatePrefix(prefix)) {
      this.logger.warn('Não foi possível detectar prefixo de rede local.');
      return [];
    }

    const tarefas: Array<{ ip: string; porta: number }> = [];
    for (let i = 1; i <= 254; i++) {
      for (const p of portas) tarefas.push({ ip: `${prefix}.${i}`, porta: p });
    }

    const encontrados: DispositivoEncontrado[] = [];
    const fila = [...tarefas];
    const workers = Array.from({ length: paralelo }, () => this.worker(fila, timeout, encontrados));
    await Promise.all(workers);
    return encontrados.sort((a, b) => a.ip.localeCompare(b.ip));
  }

  private async worker(
    fila: Array<{ ip: string; porta: number }>,
    timeout: number,
    out: DispositivoEncontrado[],
  ) {
    while (fila.length > 0) {
      const t = fila.shift();
      if (!t) return;
      // C9: retry 1x para reduzir falso-negativo em redes industriais ruidosas
      let ok = await this.probe(t.ip, t.porta, timeout);
      if (!ok) ok = await this.probe(t.ip, t.porta, timeout);
      if (ok) out.push({ ip: t.ip, porta: t.porta, rttMs: ok });
    }
  }

  private probe(ip: string, porta: number, timeoutMs: number): Promise<number | null> {
    return new Promise((resolve) => {
      const start = Date.now();
      const sock = new Socket();
      let resolved = false;
      const finalizar = (ok: boolean) => {
        if (resolved) return;
        resolved = true;
        try {
          sock.removeAllListeners();
          sock.destroy();
        } catch {
          /* ignore */
        }
        resolve(ok ? Date.now() - start : null);
      };
      sock.setTimeout(timeoutMs);
      sock.on('connect', () => finalizar(true));
      sock.on('error', () => finalizar(false));
      sock.on('timeout', () => finalizar(false));
      sock.connect(porta, ip);
    });
  }

  private detectarPrefixoLocal(): string | null {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const ni of ifaces[name] ?? []) {
        if (ni.family === 'IPv4' && !ni.internal) {
          const partes = ni.address.split('.');
          if (partes.length === 4) return partes.slice(0, 3).join('.');
        }
      }
    }
    return null;
  }
}
