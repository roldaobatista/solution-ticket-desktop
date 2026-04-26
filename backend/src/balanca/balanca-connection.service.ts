import { Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { PrismaService } from '../prisma/prisma.service';
import { createAdapter } from './adapters/adapter.factory';
import { IBalancaAdapter } from './adapters/adapter.interface';
import { createParser } from './parsers/parser.factory';
import { IBalancaParser, LeituraPeso } from './parsers/parser.interface';
import { errorMessage } from '../common/error-message.util';

export interface BalancaStatus {
  online: boolean;
  erro: string | null;
  ultimaLeitura: LeituraPeso | null;
  ultimaLeituraEm: Date | null;
}

interface ConexaoAtiva {
  adapter: IBalancaAdapter;
  parser: IBalancaParser;
  buffer: Buffer;
  emitter: EventEmitter;
  status: BalancaStatus;
  historico: number[];
}

/**
 * Orquestra adapter + parser por balança. Mantém conexões persistentes
 * e expõe um EventEmitter por balança para os consumidores (SSE).
 */
@Injectable()
export class BalancaConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(BalancaConnectionService.name);
  private readonly conexoes = new Map<string, ConexaoAtiva>();
  private static readonly TOLERANCIA_ESTAVEL = 2; // kg
  private static readonly JANELA_ESTAVEL = 5;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy() {
    for (const id of Array.from(this.conexoes.keys())) {
      await this.desconectar(id).catch(() => undefined);
    }
  }

  async getBalancaComIndicador(id: string) {
    const balanca = await this.prisma.balanca.findUnique({
      where: { id },
      include: { indicador: true },
    });
    if (!balanca) throw new NotFoundException('Balanca nao encontrada');
    return balanca;
  }

  isConectada(id: string): boolean {
    return this.conexoes.has(id);
  }

  getEmitter(id: string): EventEmitter | undefined {
    return this.conexoes.get(id)?.emitter;
  }

  getStatus(id: string): BalancaStatus {
    const c = this.conexoes.get(id);
    if (!c) {
      return { online: false, erro: null, ultimaLeitura: null, ultimaLeituraEm: null };
    }
    return { ...c.status };
  }

  getUltimaLeitura(id: string): LeituraPeso | null {
    return this.conexoes.get(id)?.status.ultimaLeitura ?? null;
  }

  async conectar(id: string): Promise<BalancaStatus> {
    if (this.conexoes.has(id)) return this.getStatus(id);
    const balanca = await this.getBalancaComIndicador(id);
    const indicador = balanca.indicador;

    const adapter = createAdapter(balanca.protocolo ?? 'serial', {
      porta: balanca.porta,
      baudrate: balanca.baudRate ?? indicador?.baudrate ?? null,
      databits: indicador?.databits ?? 8,
      stopbits: indicador?.stopbits ?? 1,
      parity: indicador?.parity ?? 'none',
      flowControl: indicador?.flowControl ?? 'none',
      enderecoIp: balanca.enderecoIp,
      portaTcp: balanca.portaTcp,
    });

    const parser = createParser({
      parserTipo: indicador?.parserTipo ?? 'generic',
      inicioPeso: indicador?.inicioPeso ?? null,
      tamanhoPeso: indicador?.tamanhoPeso ?? null,
      tamanhoString: indicador?.tamanhoString ?? null,
      marcador: indicador?.marcador ?? null,
      fator: indicador?.fator ?? null,
      invertePeso: indicador?.invertePeso ?? false,
    });

    const conexao: ConexaoAtiva = {
      adapter,
      parser,
      buffer: Buffer.alloc(0),
      emitter: new EventEmitter(),
      status: { online: false, erro: null, ultimaLeitura: null, ultimaLeituraEm: null },
      historico: [],
    };

    adapter.on('data', (chunk: Buffer) => this.processarChunk(conexao, chunk));
    adapter.on('error', (err: Error) => {
      this.logger.warn(`Balanca ${id} erro: ${errorMessage(err)}`);
      conexao.status.erro = errorMessage(err);
      conexao.emitter.emit('error', err);
    });
    adapter.on('close', () => {
      conexao.status.online = false;
      conexao.emitter.emit('close');
    });
    // C11: flush de buffer residual ao reconectar — evita parse de meia-trama
    adapter.on('reconectando', (info: { tentativa: number; delayMs: number }) => {
      conexao.status.online = false;
      this.logger.warn(
        `Balanca ${id} reconectando (tentativa=${info.tentativa} delay=${info.delayMs}ms)`,
      );
      conexao.emitter.emit('reconectando', info);
    });
    adapter.on('reconectado', () => {
      conexao.buffer = Buffer.alloc(0);
      conexao.historico = [];
      conexao.status.online = true;
      conexao.status.erro = null;
      this.logger.log(`Balanca ${id} reconectada`);
      conexao.emitter.emit('reconectado');
    });
    adapter.on('alerta', (info: { mensagem: string; ultimaTentativaErro: string }) => {
      this.logger.error(`Balanca ${id} ALERTA: ${info.mensagem}`);
      conexao.emitter.emit('alerta', info);
    });
    adapter.on('falha-permanente', (info: { tentativas: number }) => {
      this.logger.error(`Balanca ${id} falha permanente apos ${info.tentativas} tentativas`);
      conexao.status.online = false;
      conexao.status.erro = `Falha permanente apos ${info.tentativas} tentativas`;
      conexao.emitter.emit('falha-permanente', info);
    });

    try {
      await adapter.connect();
      conexao.status.online = true;
      conexao.status.erro = null;
      this.conexoes.set(id, conexao);
    } catch (err: unknown) {
      conexao.status.online = false;
      conexao.status.erro = errorMessage(err) ?? String(err);
      throw err;
    }
    return this.getStatus(id);
  }

  async desconectar(id: string): Promise<void> {
    const c = this.conexoes.get(id);
    if (!c) return;
    await c.adapter.close().catch(() => undefined);
    // RC1: limpa listeners do adapter alem do emitter interno para evitar leak
    c.adapter.removeAllListeners();
    c.emitter.removeAllListeners();
    this.conexoes.delete(id);
  }

  /** Tenta abrir conexão por {@link timeoutMs} e fecha em seguida. */
  async testar(id: string, timeoutMs = 2000): Promise<{ sucesso: boolean; erro?: string }> {
    const balanca = await this.getBalancaComIndicador(id);
    const indicador = balanca.indicador;
    const adapter = createAdapter(
      balanca.protocolo ?? 'serial',
      {
        porta: balanca.porta,
        baudrate: balanca.baudRate ?? indicador?.baudrate ?? null,
        databits: indicador?.databits ?? 8,
        stopbits: indicador?.stopbits ?? 1,
        parity: indicador?.parity ?? 'none',
        flowControl: indicador?.flowControl ?? 'none',
        enderecoIp: balanca.enderecoIp,
        portaTcp: balanca.portaTcp,
        connectTimeoutMs: timeoutMs,
      },
      { autoReconnect: false }, // teste de conexao: falhar rapido
    );
    try {
      await Promise.race([
        adapter.connect(),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);
      await adapter.close();
      return { sucesso: true };
    } catch (err: unknown) {
      await adapter.close().catch(() => undefined);
      return { sucesso: false, erro: errorMessage(err) ?? String(err) };
    }
  }

  /** Aguarda peso estável ou retorna a última leitura após timeout. */
  async capturar(id: string, timeoutMs = 3000): Promise<LeituraPeso | null> {
    if (!this.conexoes.has(id)) await this.conectar(id);
    const c = this.conexoes.get(id);
    if (!c) return null;
    if (c.status.ultimaLeitura?.estavel) return c.status.ultimaLeitura;

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        c.emitter.off('leitura', onLeitura);
        resolve(c.status.ultimaLeitura);
      }, timeoutMs);
      const onLeitura = (l: LeituraPeso) => {
        if (l.estavel) {
          clearTimeout(timer);
          c.emitter.off('leitura', onLeitura);
          resolve(l);
        }
      };
      c.emitter.on('leitura', onLeitura);
    });
  }

  private processarChunk(conexao: ConexaoAtiva, chunk: Buffer) {
    conexao.buffer = Buffer.concat([conexao.buffer, chunk]);
    // RC4: registra trim do buffer (descarte de tramas antigas) para diagnostico
    if (conexao.buffer.length > 4096) {
      const descartados = conexao.buffer.length - 1024;
      this.logger.warn(
        `Buffer trim: descartados ${descartados} bytes (parser nao acompanhou). ` +
          'Possivel rajada acima da capacidade de processamento.',
      );
      conexao.buffer = conexao.buffer.subarray(conexao.buffer.length - 1024);
    }
    // Processa todas as tramas completas disponíveis
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { leitura, restante } = conexao.parser.parse(conexao.buffer);
      conexao.buffer = restante;
      if (!leitura) break;
      this.aplicarEstabilidade(conexao, leitura);
      conexao.status.ultimaLeitura = leitura;
      conexao.status.ultimaLeituraEm = new Date();
      conexao.emitter.emit('leitura', leitura);
    }
  }

  private aplicarEstabilidade(conexao: ConexaoAtiva, leitura: { peso: number; estavel: boolean }) {
    conexao.historico.push(leitura.peso);
    if (conexao.historico.length > BalancaConnectionService.JANELA_ESTAVEL) {
      conexao.historico.shift();
    }
    // Onda 1.7 (C9): parser estavel:true e definitivo (byte de status real).
    // Quando parser retorna false (sem status confiavel), exige-se janela
    // movel completa dentro da tolerancia. Antes alguns parsers retornavam
    // true hardcoded, permitindo travar peso instavel para ticket.
    if (leitura.estavel) return;
    if (conexao.historico.length < BalancaConnectionService.JANELA_ESTAVEL) return;
    const min = Math.min(...conexao.historico);
    const max = Math.max(...conexao.historico);
    if (max - min <= BalancaConnectionService.TOLERANCIA_ESTAVEL) {
      leitura.estavel = true;
    }
  }
}
