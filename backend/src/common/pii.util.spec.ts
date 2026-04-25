import { scrubPii } from './pii.util';

describe('scrubPii', () => {
  it('mascara campos sensiveis no topo do objeto', () => {
    const out = scrubPii({ email: 'a@b.com', senha: '123456', token: 'xyz' }) as Record<
      string,
      unknown
    >;
    expect(out.email).toBe('a@b.com');
    expect(out.senha).toBe('[REDACTED]');
    expect(out.token).toBe('[REDACTED]');
  });

  it('mascara recursivamente em estruturas aninhadas', () => {
    const out = scrubPii({
      user: { id: '1', password: 'secret', cpf: '12345678901' },
      nested: [{ apiKey: 'k1' }],
    }) as any;
    expect(out.user.password).toBe('[REDACTED]');
    expect(out.user.cpf).toBe('[REDACTED]');
    expect(out.user.id).toBe('1');
    expect(out.nested[0].apiKey).toBe('[REDACTED]');
  });

  it('detecta JWT heuristicamente em string solta', () => {
    const jwt = 'eyJhbGciOi.eyJzdWIiOiI.signature123-_';
    expect(scrubPii(jwt)).toBe('[REDACTED]');
  });

  it('preserva valores nao sensiveis', () => {
    const out = scrubPii({ nome: 'Joao', idade: 30, ativo: true });
    expect(out).toEqual({ nome: 'Joao', idade: 30, ativo: true });
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
});
