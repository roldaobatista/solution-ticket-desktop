import { EventEmitter } from 'events';
import { IBalancaAdapter } from './adapter.interface';

export interface ReconnectOptions {
  baseDelayMs?: number; // default 1000
  maxDelayMs?: number; // default 30_000
  maxTentativas?: number; // default Infinity
  /** Alerta na UI a cada N falhas consecutivas (default 5). */
  alertarACada?: number;
}

/**
 * Decorator que envelopa qualquer IBalancaAdapter com reconexão automática.
 *
 * Comportamento:
 *  - Ao receber 'close' inesperado, agenda tentativa com backoff exponencial
 *    capped (1s → 2s → 4s → … → maxDelayMs).
 *  - Encaminha 'data' e 'error' do inner transparentemente.
 *  - Emite eventos próprios: 'reconectando' { tentativa, delayMs },
 *    'reconectado', 'falha-permanente'.
 *  - O consumidor (BalancaConnectionService) deve tratar 'reconectado' para
 *    limpar buffer residual (C11 da auditoria).
 */
export class ReconnectingAdapter extends EventEmitter implements IBalancaAdapter {
  private aberto = false;
  private desejarAberto = false;
  private tentativa = 0;
  private falhasConsecutivas = 0;
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly inner: IBalancaAdapter,
    private readonly opts: ReconnectOptions = {},
  ) {
    super();
    this.inner.on('data', (b) => this.emit('data', b));
    this.inner.on('error', (e) => {
      this.emit('error', e);
    });
    this.inner.on('close', () => {
      this.aberto = false;
      if (this.desejarAberto) {
        this.agendarReconexao();
      } else {
        this.emit('close');
      }
    });
  }

  async connect(): Promise<void> {
    this.desejarAberto = true;
    await this.inner.connect();
    this.aberto = true;
    this.tentativa = 0;
    this.falhasConsecutivas = 0; // primeiro connect: zera contador de sessao
  }

  async close(): Promise<void> {
    this.desejarAberto = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.inner.close();
    this.aberto = false;
    this.emit('close');
  }

  isOpen(): boolean {
    return this.aberto;
  }

  private agendarReconexao() {
    const base = this.opts.baseDelayMs ?? 1000;
    const max = this.opts.maxDelayMs ?? 30_000;
    const maxTent = this.opts.maxTentativas ?? Infinity;
    const alertarACada = this.opts.alertarACada ?? 5;

    if (this.tentativa >= maxTent) {
      this.emit('falha-permanente', { tentativas: this.tentativa });
      this.desejarAberto = false;
      this.emit('close');
      return;
    }

    const delay = Math.min(base * 2 ** this.tentativa, max);
    this.tentativa++;
    this.falhasConsecutivas++;
    this.emit('reconectando', { tentativa: this.tentativa, delayMs: delay });

    this.timer = setTimeout(async () => {
      this.timer = null;
      if (!this.desejarAberto) return;
      try {
        await this.inner.connect();
        this.aberto = true;
        this.tentativa = 0;
        // RC2: NAO zerar falhasConsecutivas aqui — manter contador acumulado para alerta.
        // O alerta dispara em "Mx N falhas" total na sessao, nao por janela curta.
        this.emit('reconectado');
      } catch (err: any) {
        this.emit('error', err);
        if (this.falhasConsecutivas % alertarACada === 0) {
          this.emit('alerta', {
            mensagem: `Balanca nao reconectou apos ${this.falhasConsecutivas} tentativas`,
            ultimaTentativaErro: err?.message ?? String(err),
          });
        }
        this.agendarReconexao();
      }
    }, delay);
  }
}
