import { EventEmitter } from 'events';
import { IBalancaAdapter } from './adapter.interface';
import { ReconnectingAdapter } from './reconnecting.adapter';

/** Adapter fake controlável pelos testes. */
class FakeAdapter extends EventEmitter implements IBalancaAdapter {
  public connectCalls = 0;
  public shouldFailNext = 0;
  private aberto = false;

  async connect(): Promise<void> {
    this.connectCalls++;
    if (this.shouldFailNext > 0) {
      this.shouldFailNext--;
      throw new Error('connect failure');
    }
    this.aberto = true;
  }
  async close(): Promise<void> {
    this.aberto = false;
  }
  isOpen(): boolean {
    return this.aberto;
  }
}

describe('ReconnectingAdapter', () => {
  it('reconecta apos close inesperado com backoff', async () => {
    const fake = new FakeAdapter();
    const wrap = new ReconnectingAdapter(fake, { baseDelayMs: 10, maxDelayMs: 50 });

    await wrap.connect();
    expect(fake.connectCalls).toBe(1);

    const onReconectado = new Promise<void>((resolve) => wrap.on('reconectado', () => resolve()));
    const onReconectando = jest.fn();
    wrap.on('reconectando', onReconectando);

    // Simula queda inesperada vinda do inner
    fake.emit('close');
    await onReconectado;

    expect(fake.connectCalls).toBeGreaterThanOrEqual(2);
    expect(onReconectando).toHaveBeenCalled();
    await wrap.close();
  });

  it('nao tenta reconectar apos close() explicito', async () => {
    const fake = new FakeAdapter();
    const wrap = new ReconnectingAdapter(fake, { baseDelayMs: 10 });
    await wrap.connect();
    await wrap.close();
    fake.emit('close'); // ja fechamos; nao deve tentar reconectar
    await new Promise((r) => setTimeout(r, 30));
    expect(fake.connectCalls).toBe(1);
  });

  it('emite falha-permanente ao atingir maxTentativas', async () => {
    const fake = new FakeAdapter();
    const wrap = new ReconnectingAdapter(fake, {
      baseDelayMs: 5,
      maxDelayMs: 10,
      maxTentativas: 1,
    });
    // Conecta ok na primeira tentativa...
    await wrap.connect();
    // Sem handler de 'error', EventEmitter lanca — tem que registrar.
    wrap.on('error', () => undefined);
    // ...depois derruba e marca o proximo connect para falhar sempre.
    fake.shouldFailNext = 10;

    const onFalha = new Promise<{ tentativas: number }>((resolve) =>
      wrap.on('falha-permanente', (info) => resolve(info)),
    );
    fake.emit('close');
    const info = await onFalha;
    expect(info.tentativas).toBeGreaterThanOrEqual(1);
  }, 10_000);

  it('H2: rajada de close emite apenas um agendamento de reconexao', async () => {
    const fake = new FakeAdapter();
    const wrap = new ReconnectingAdapter(fake, { baseDelayMs: 30, maxDelayMs: 100 });
    await wrap.connect();

    const onReconectando = jest.fn();
    wrap.on('reconectando', onReconectando);
    const onReconectado = new Promise<void>((resolve) => wrap.on('reconectado', () => resolve()));

    // Tres closes em rajada (ex.: error + close + close do socket)
    fake.emit('close');
    fake.emit('close');
    fake.emit('close');

    await onReconectado;

    // Sem o guard, cada close criaria um setTimeout — multiplas reconexoes.
    // Com idempotencia, apenas o primeiro agenda.
    expect(onReconectando).toHaveBeenCalledTimes(1);
    expect(fake.connectCalls).toBe(2); // 1 connect inicial + 1 reconect
    await wrap.close();
  });

  it('encaminha data e error do inner', async () => {
    const fake = new FakeAdapter();
    const wrap = new ReconnectingAdapter(fake, { baseDelayMs: 10 });
    await wrap.connect();

    const onData = new Promise<Buffer>((resolve) => wrap.on('data', resolve));
    const onErr = new Promise<Error>((resolve) => wrap.on('error', resolve));
    fake.emit('data', Buffer.from('hello'));
    fake.emit('error', new Error('boom'));
    expect((await onData).toString()).toBe('hello');
    expect((await onErr).message).toBe('boom');
    await wrap.close();
  });
});
