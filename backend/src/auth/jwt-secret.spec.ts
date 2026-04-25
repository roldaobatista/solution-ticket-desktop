import { requireJwtSecret } from './jwt-secret';

describe('requireJwtSecret', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('lança erro se JWT_SECRET ausente', () => {
    delete process.env.JWT_SECRET;
    expect(() => requireJwtSecret()).toThrow(/JWT_SECRET ausente/);
  });

  it('lança erro se segredo curto', () => {
    process.env.JWT_SECRET = 'curto';
    expect(() => requireJwtSecret()).toThrow(/muito curto/);
  });

  it('lança erro para fallback público conhecido', () => {
    process.env.JWT_SECRET = 'solutionticket-secret-key-2024';
    expect(() => requireJwtSecret()).toThrow(/valor padrão público/);
  });

  it('aceita segredo forte', () => {
    process.env.JWT_SECRET = 'a'.repeat(48);
    expect(requireJwtSecret()).toBe('a'.repeat(48));
  });
});
