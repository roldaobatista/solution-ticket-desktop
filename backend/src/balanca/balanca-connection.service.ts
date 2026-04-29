import { Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { createAdapter } from './adapters/adapter.factory';
import { IBalancaAdapter } from './adapters/adapter.interface';
import { createParser } from './parsers/parser.factory';
import { IBalancaParser, LeituraPeso } from './parsers/parser.interface';
import { errorMessage } from '../common/error-message.util';
import { ReadConfig, resolveEffectiveConfig } from './config-resolver';
import { getUserDataDir } from '../common/desktop-paths';

export interface BalancaStatus {
  online: boolean;
  erro: string | null;
  ultimaLeitura: LeituraPeso | null;
  ultimaLeituraEm: Date | null;
}

interface ConexaoAtiva {
  id: string;
  tenantId: string;
  adapter: IBalancaAdapter;
  parser: IBalancaParser;
  buffer: Buffer;
  emitter: EventEmitter;
  status: BalancaStatus;
  historico: number[];
  toleranciaEstabilidade: number;
  janelaEstabilidade: number;
  comandoTimer?: NodeJS.Timeout | null;
  debugLogPath?: string | null;
}

/**
 * Orquestra adapter + parser por balança. Mantém conexões persistentes
 * e expõe um EventEmitter por balança para os consumidores (SSE).
 */
@Injectable()
export class BalancaConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(BalancaConnectionService.name);
  private readonly conexoes = new Map<string, ConexaoAtiva>();
  private readonly conexoesPendentes = new Map<string, Promise<BalancaStatus>>();
  private static readonly TOLERANCIA_ESTAVEL = 2; // kg
  private static readonly JANELA_ESTAVEL = 5;
  private static readonly LEITURA_ESTAVEL_TTL_MS = 1000;

  constructor(private readonly prisma: PrismaService) {}

  async onModuleDestroy() {
    for (const id of Array.from(this.conexoes.keys())) {
      await this.desconectar(id).catch(() => undefined);
    }
  }

  async getBalancaComIndicador(id: string, tenantId: string) {
    const balanca = await this.prisma.balanca.findFirst({
      where: { id, tenantId },
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

  private async persistirStatusOnline(id: string, tenantId: string, statusOnline: boolean) {
    if (typeof this.prisma.balanca.update !== 'function') return;
    await this.prisma.balanca
      .update({
        where: { id, tenantId },
        data: { statusOnline, atualizadoEm: new Date() },
      })
      .catch((err: unknown) =>
        this.logger.warn(`Falha ao persistir status da balanca ${id}: ${errorMessage(err)}`),
      );
  }

  async conectar(id: string, tenantId: string): Promise<BalancaStatus> {
    if (this.conexoes.has(id)) return this.getStatus(id);
    const pendente = this.conexoesPendentes.get(id);
    if (pendente) return pendente;

    const tarefa = this.conectarNova(id, tenantId);
    this.conexoesPendentes.set(id, tarefa);
    try {
      return await tarefa;
    } finally {
      this.conexoesPendentes.delete(id);
    }
  }

  private async conectarNova(id: string, tenantId: string): Promise<BalancaStatus> {
    const balanca = await this.getBalancaComIndicador(id, tenantId);
    const config = resolveEffectiveConfig(balanca, balanca.indicador);

    const adapter = createAdapter(config.protocolo, {
      porta:
        config.protocolo === 'serial' || config.protocolo === 'modbus-rtu' ? balanca.porta : null,
      baudrate: config.serial.baudRate,
      databits: config.serial.dataBits,
      stopbits: config.serial.stopBits,
      parity: config.serial.parity,
      flowControl: config.serial.flowControl,
      enderecoIp:
        config.protocolo === 'tcp' || config.protocolo === 'modbus-tcp' ? balanca.enderecoIp : null,
      portaTcp:
        config.protocolo === 'tcp' || config.protocolo === 'modbus-tcp' ? balanca.portaTcp : null,
      intervalMs: (config.read.intervalMs ?? config.atraso) || null,
      modbusUnitId: config.modbus.unitId,
      modbusRegister: config.modbus.register,
      modbusFunction: config.modbus.function,
      modbusByteOrder: config.modbus.byteOrder,
      modbusWordOrder: config.modbus.wordOrder,
      modbusSigned: config.modbus.signed,
      modbusScale: config.modbus.scale,
      modbusOffset: config.modbus.offset,
    });

    const parser = createParser(config.parser);
    const debugLogPath = balanca.debugMode ? this.criarDebugLogPath(id) : null;

    const conexao: ConexaoAtiva = {
      id,
      tenantId,
      adapter,
      parser,
      buffer: Buffer.alloc(0),
      emitter: new EventEmitter(),
      status: { online: false, erro: null, ultimaLeitura: null, ultimaLeituraEm: null },
      historico: [],
      toleranciaEstabilidade:
        balanca.toleranciaEstabilidade ?? BalancaConnectionService.TOLERANCIA_ESTAVEL,
      janelaEstabilidade: balanca.janelaEstabilidade ?? BalancaConnectionService.JANELA_ESTAVEL,
      debugLogPath,
    };

    adapter.on('data', (chunk: Buffer) => this.processarChunk(conexao, chunk));
    adapter.on('error', (err: Error) => {
      this.logger.warn(`Balanca ${id} erro: ${errorMessage(err)}`);
      conexao.status.online = false;
      conexao.status.erro = errorMessage(err);
      void this.persistirStatusOnline(id, tenantId, false);
      conexao.emitter.emit('error', err);
    });
    adapter.on('close', () => {
      conexao.status.online = false;
      void this.persistirStatusOnline(id, tenantId, false);
      conexao.emitter.emit('close');
    });
    // C11: flush de buffer residual ao reconectar — evita parse de meia-trama
    adapter.on('reconectando', (info: { tentativa: number; delayMs: number }) => {
      conexao.status.online = false;
      void this.persistirStatusOnline(id, tenantId, false);
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
      void this.persistirStatusOnline(id, tenantId, true);
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
      void this.persistirStatusOnline(id, tenantId, false);
      conexao.emitter.emit('falha-permanente', info);
    });

    try {
      await adapter.connect();
      conexao.status.online = true;
      conexao.status.erro = null;
      this.conexoes.set(id, conexao);
      await this.persistirStatusOnline(id, tenantId, true);
      this.iniciarPollingComando(conexao, config.read, config.parser.parserTipo, config.atraso);
    } catch (err: unknown) {
      conexao.status.online = false;
      conexao.status.erro = errorMessage(err) ?? String(err);
      await this.persistirStatusOnline(id, tenantId, false);
      throw err;
    }
    return this.getStatus(id);
  }

  async desconectar(id: string): Promise<void> {
    const c = this.conexoes.get(id);
    if (!c) return;
    await c.adapter.close().catch(() => undefined);
    if (c.comandoTimer) {
      clearInterval(c.comandoTimer);
      c.comandoTimer = null;
    }
    // RC1: limpa listeners do adapter alem do emitter interno para evitar leak
    c.adapter.removeAllListeners();
    c.emitter.removeAllListeners();
    this.conexoes.delete(id);
    await this.persistirStatusOnline(id, c.tenantId, false);
  }

  /** Tenta abrir conexão por {@link timeoutMs} e fecha em seguida. */
  async testar(
    id: string,
    tenantId: string,
    timeoutMs = 2000,
  ): Promise<{ sucesso: boolean; erro?: string }> {
    const balanca = await this.getBalancaComIndicador(id, tenantId);
    const config = resolveEffectiveConfig(balanca, balanca.indicador);
    const parser = createParser(config.parser);
    const adapter = createAdapter(
      config.protocolo,
      {
        porta:
          config.protocolo === 'serial' || config.protocolo === 'modbus-rtu' ? balanca.porta : null,
        baudrate: config.serial.baudRate,
        databits: config.serial.dataBits,
        stopbits: config.serial.stopBits,
        parity: config.serial.parity,
        flowControl: config.serial.flowControl,
        enderecoIp:
          config.protocolo === 'tcp' || config.protocolo === 'modbus-tcp'
            ? balanca.enderecoIp
            : null,
        portaTcp:
          config.protocolo === 'tcp' || config.protocolo === 'modbus-tcp' ? balanca.portaTcp : null,
        intervalMs: (config.read.intervalMs ?? config.atraso) || null,
        modbusUnitId: config.modbus.unitId,
        modbusRegister: config.modbus.register,
        modbusFunction: config.modbus.function,
        modbusByteOrder: config.modbus.byteOrder,
        modbusWordOrder: config.modbus.wordOrder,
        modbusSigned: config.modbus.signed,
        modbusScale: config.modbus.scale,
        modbusOffset: config.modbus.offset,
        connectTimeoutMs: timeoutMs,
      },
      { autoReconnect: false }, // teste de conexao: falhar rapido
    );
    try {
      let buffer: Buffer<ArrayBufferLike> = Buffer.alloc(0);
      const leituraPromise = new Promise<boolean>((resolve) => {
        const onData = (chunk: Buffer) => {
          buffer = Buffer.concat([buffer, chunk]);
          const { leitura, restante } = parser.parse(buffer);
          buffer = restante;
          if (leitura) {
            adapter.off('data', onData);
            resolve(true);
          }
        };
        adapter.on('data', onData);
      });
      await Promise.race([
        adapter.connect(),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
      ]);
      const comando = this.obterComandoLeitura(config.read, config.parser.parserTipo);
      if (comando) {
        await adapter.write?.(comando).catch(() => undefined);
      }
      const recebeuLeitura = await Promise.race([
        leituraPromise,
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
      ]);
      await adapter.close();
      return recebeuLeitura
        ? { sucesso: true }
        : { sucesso: false, erro: 'Conexao aberta, mas nenhuma leitura parseavel foi recebida' };
    } catch (err: unknown) {
      await adapter.close().catch(() => undefined);
      return { sucesso: false, erro: errorMessage(err) ?? String(err) };
    }
  }

  /** Aguarda uma leitura estável nova; no timeout falha sem reutilizar peso antigo. */
  async capturar(id: string, tenantId: string, timeoutMs = 3000): Promise<LeituraPeso | null> {
    if (!this.conexoes.has(id)) await this.conectar(id, tenantId);
    const c = this.conexoes.get(id);
    if (!c) return null;
    const startedAt = Date.now();
    if (
      c.status.ultimaLeitura?.estavel &&
      c.status.ultimaLeituraEm &&
      startedAt - c.status.ultimaLeituraEm.getTime() <=
        BalancaConnectionService.LEITURA_ESTAVEL_TTL_MS
    ) {
      return c.status.ultimaLeitura;
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        c.emitter.off('leitura', onLeitura);
        resolve(null);
      }, timeoutMs);
      const onLeitura = (l: LeituraPeso) => {
        const leituraEm = c.status.ultimaLeituraEm?.getTime() ?? Date.now();
        if (l.estavel && leituraEm >= startedAt) {
          clearTimeout(timer);
          c.emitter.off('leitura', onLeitura);
          resolve(l);
        }
      };
      c.emitter.on('leitura', onLeitura);
    });
  }

  private processarChunk(conexao: ConexaoAtiva, chunk: Buffer) {
    this.dumpDebug(conexao, chunk);
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

  private criarDebugLogPath(id: string): string {
    const dir = path.join(getUserDataDir(), 'logs');
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, `balanca-${id}.log`);
  }

  private dumpDebug(conexao: ConexaoAtiva, chunk: Buffer): void {
    if (!conexao.debugLogPath) return;
    const ascii = chunk.toString('ascii').replace(/[^\x20-\x7E\r\n\t]/g, '.');
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      balancaId: conexao.id,
      bytes: chunk.length,
      hex: chunk.toString('hex'),
      ascii,
    });
    fs.promises
      .appendFile(conexao.debugLogPath, `${line}\n`, 'utf8')
      .catch((err) => this.logger.warn(`Falha ao gravar debug da balanca ${conexao.id}: ${err}`));
  }

  private iniciarPollingComando(
    conexao: ConexaoAtiva,
    read: ReadConfig,
    parserTipo: string | null | undefined,
    atraso: number,
  ) {
    if (!conexao.adapter.write) return;
    const comando = this.obterComandoLeitura(read, parserTipo);
    if (!comando) return;
    if (read.mode === 'manual') return;
    if (read.mode === 'continuous' && read.commandHex) return;
    const enviar = () => conexao.adapter.write?.(comando).catch(() => undefined);
    enviar();
    conexao.comandoTimer = setInterval(enviar, Math.max((read.intervalMs ?? atraso) || 500, 200));
  }

  private obterComandoLeitura(
    read: ReadConfig,
    parserTipo: string | null | undefined,
  ): Buffer | null {
    const commandHex = read.commandHex?.replace(/\s+/g, '');
    if (commandHex) return Buffer.from(commandHex, 'hex');
    if (this.parserPrecisaEnq(parserTipo)) return Buffer.from([0x05]);
    return null;
  }

  private parserPrecisaEnq(parserTipo: string | null | undefined): boolean {
    const tipo = (parserTipo ?? '').toLowerCase();
    return tipo === 'toledo-c' || tipo === 'filizola-at' || tipo === 'filizola-@';
  }

  private aplicarEstabilidade(conexao: ConexaoAtiva, leitura: { peso: number; estavel: boolean }) {
    conexao.historico.push(leitura.peso);
    if (conexao.historico.length > conexao.janelaEstabilidade) {
      conexao.historico.shift();
    }
    // Onda 1.7 (C9): parser estavel:true e definitivo (byte de status real).
    // Quando parser retorna false (sem status confiavel), exige-se janela
    // movel completa dentro da tolerancia. Antes alguns parsers retornavam
    // true hardcoded, permitindo travar peso instavel para ticket.
    if (leitura.estavel) return;
    if (conexao.historico.length < conexao.janelaEstabilidade) return;
    const min = Math.min(...conexao.historico);
    const max = Math.max(...conexao.historico);
    if (max - min <= conexao.toleranciaEstabilidade) {
      leitura.estavel = true;
    }
  }
}
