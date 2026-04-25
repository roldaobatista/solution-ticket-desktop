import { EventEmitter } from 'events';
import * as net from 'net';
import { AdapterConfig, IBalancaAdapter } from './adapter.interface';

/**
 * Adaptador TCP/IP. Hardening aplicado (C1, C2 da auditoria):
 *  - `setTimeout` na conexão para evitar pendurar indefinidamente
 *  - `setKeepAlive(true, keepAliveMs)` para detectar quedas em NAT/firewall
 *  - `setNoDelay(true)` — latência baixa é mais importante que coalescência para tramas de peso
 *
 * Reconexão automática é responsabilidade do `ReconnectingAdapter` (decorator).
 */
export class TcpAdapter extends EventEmitter implements IBalancaAdapter {
  private socket: net.Socket | null = null;
  private conectado = false;

  constructor(private config: AdapterConfig) {
    super();
  }

  async connect(): Promise<void> {
    if (!this.config.enderecoIp || !this.config.portaTcp) {
      throw new Error('IP/porta TCP nao configurados');
    }
    const connectTimeout = this.config.connectTimeoutMs ?? 5000;
    const keepAliveMs = this.config.keepAliveMs ?? 10_000;

    await new Promise<void>((resolve, reject) => {
      const sock = new net.Socket();
      const onErr = (err: Error) => {
        sock.destroy();
        reject(err);
      };
      sock.setTimeout(connectTimeout);
      sock.once('timeout', () => onErr(new Error(`TCP connect timeout apos ${connectTimeout}ms`)));
      sock.once('error', onErr);
      sock.connect(this.config.portaTcp!, this.config.enderecoIp!, () => {
        sock.off('error', onErr);
        sock.setTimeout(0); // desliga o timer de connect
        sock.setKeepAlive(true, keepAliveMs);
        sock.setNoDelay(true);
        this.socket = sock;
        this.conectado = true;
        sock.on('data', (b: Buffer) => this.emit('data', b));
        sock.on('error', (e: Error) => this.emit('error', e));
        sock.on('close', () => {
          this.conectado = false;
          this.emit('close');
        });
        resolve();
      });
    });
  }

  async close(): Promise<void> {
    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
      this.conectado = false;
    }
  }

  isOpen(): boolean {
    return this.conectado;
  }
}
