import { AutoDetectService } from './auto-detect.service';

describe('AutoDetectService', () => {
  const service = new AutoDetectService();

  it('reconhece trama Digitron real entre os candidatos top', () => {
    const buf = Buffer.concat([Buffer.from('D000.318'), Buffer.from([0x0d])]);
    const candidatos = service.detectar(buf);
    expect(candidatos.length).toBeGreaterThan(0);
    // Onda 1.7 (C9): apos remocao de estavel:true hardcoded, varios parsers
    // ficam com confianca similar para tramas curtas. Verifica que Digitron
    // ou Generica esta no top 5 (limite do detectar()).
    const tem = candidatos.some((c) => /Digitron|Genérica/i.test(c.preset.fabricante));
    expect(tem).toBe(true);
  });

  it('reconhece trama Filizola "@" real', () => {
    const buf = Buffer.concat([Buffer.from('@002.448'), Buffer.from([0x0d])]);
    const candidatos = service.detectar(buf);
    const filizolaAt = candidatos.find((c) => c.preset.id === 'filizola-at');
    expect(filizolaAt).toBeDefined();
    expect(filizolaAt!.leitura.peso).toBeCloseTo(2.448, 3);
  });

  it('reconhece Toledo Protocol C', () => {
    const buf = Buffer.concat([
      Buffer.from([0x02]),
      Buffer.from('i2  00010000000'),
      Buffer.from([0x0d, 0x05]),
    ]);
    const candidatos = service.detectar(buf);
    const toledoC = candidatos.find((c) => c.preset.id === 'toledo-protocolo-c');
    expect(toledoC).toBeDefined();
  });

  it('retorna lista vazia para bytes irreconhecíveis', () => {
    const buf = Buffer.from([0xff, 0xfe, 0xfd, 0xfc]);
    const candidatos = service.detectar(buf);
    expect(candidatos.length).toBe(0);
  });

  it('ranqueia por confiança decrescente', () => {
    const buf = Buffer.concat([
      Buffer.from('D000.318'),
      Buffer.from([0x0d]),
      Buffer.from('D000.319'),
      Buffer.from([0x0d]),
    ]);
    const candidatos = service.detectar(buf);
    for (let i = 1; i < candidatos.length; i++) {
      expect(candidatos[i - 1].confianca).toBeGreaterThanOrEqual(candidatos[i].confianca);
    }
  });
});
