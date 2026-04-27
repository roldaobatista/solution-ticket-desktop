import { scrubPii } from './pii.util';

describe('scrubPii', () => {
  it('mascara campos sensiveis no topo do objeto', () => {
    const out = scrubPii({
      email: 'a@b.com',
      senha: '123456',
      token: 'xyz',
      telefone: '(11) 99999-9999',
      cpf: '12345678901',
    }) as Record<string, unknown>;
    expect(out.email).toBe('[REDACTED]');
    expect(out.senha).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
    expect(out.telefone).toBe('[REDACTED]');
    expect(out.cpf).toBe('[REDACTED]');
  });

  it('mascara recursivamente em estruturas aninhadas', () => {
    const out = scrubPii({
      user: { id: '1', password: 'secret', cpf: '12345678901', placa: 'ABC-1234' },
      nested: [{ apiKey: 'k1' }],
      local: { logradouro: 'Rua X', numero: 100, cep: '12345-000' },
    }) as any;
    expect(out.user.password).toBe('[REDACTED]');
    expect(out.user.cpf).toBe('[REDACTED]');
    expect(out.user.placa).toBe('[REDACTED]');
    expect(out.user.id).toBe('1');
    expect(out.nested[0].apiKey).toBe('[REDACTED]');
    expect(out.local.logradouro).toBe('[REDACTED]');
    expect(out.local.cep).toBe('[REDACTED]');
    expect(out.local.numero).toBe(100);
  });

  it('detecta JWT heuristicamente em string solta', () => {
    const jwt = 'eyJhbGciOi.eyJzdWIiOiI.signature123-_';
    expect(scrubPii(jwt)).toBe('[REDACTED]');
  });

  it('preserva valores nao sensiveis', () => {
    const out = scrubPii({ nome: 'Joao', idade: 30, ativo: true, produto: 'Milho' });
    expect(out).toEqual({ nome: 'Joao', idade: 30, ativo: true, produto: 'Milho' });
  });

  it('nao quebra com null/undefined', () => {
    expect(scrubPii(null)).toBeNull();
    expect(scrubPii(undefined)).toBeUndefined();
  });

  it('aplica cap de profundidade para evitar ciclo', () => {
    const obj: any = {};
    obj.self = obj;
    expect(() => scrubPii(obj)).not.toThrow();
  });

  it('mascara campos empresariais e veiculares', () => {
    const out = scrubPii({
      razaoSocial: 'Empresa X',
      nomeFantasia: 'Fantasia',
      cnpj: '12.345.678/0001-90',
      cnh: '00123456789',
      renavam: '123456789',
      contato: 'Joao',
    }) as Record<string, unknown>;
    expect(out.razaoSocial).toBe('[REDACTED]');
    expect(out.nomeFantasia).toBe('[REDACTED]');
    expect(out.cnpj).toBe('[REDACTED]');
    expect(out.cnh).toBe('[REDACTED]');
    expect(out.renavam).toBe('[REDACTED]');
    expect(out.contato).toBe('[REDACTED]');
  });
});
