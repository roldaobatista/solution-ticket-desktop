import { EventEmitter } from 'events';
import * as net from 'net';
import { AdapterConfig, IBalancaAdapter } from './adapter.interface';

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
    await new Promise<void>((resolve, reject) => {
      const sock = new net.Socket();
      const onErr = (err: Error) => {
        sock.destroy();
        reject(err);
      };
      sock.once('error', onErr);
      sock.connect(this.config.portaTcp!, this.config.enderecoIp!, () => {
        sock.off('error', onErr);
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
