import { encrypt, decrypt } from './crypto.util';

describe('crypto.util', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'c'.repeat(48);
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('criptografa e descriptografa texto simples', () => {
    const original = 'minha-senha-smtp-123';
    const cipher = encrypt(original);
    expect(cipher).not.toBe(original);
    expect(decrypt(cipher)).toBe(original);
  });

  it('produz ciphertext diferente para mesma entrada (IV aleatorio)', () => {
    const original = 'teste';
    const c1 = encrypt(original);
    const c2 = encrypt(original);
    expect(c1).not.toBe(c2);
    expect(decrypt(c1)).toBe(original);
    expect(decrypt(c2)).toBe(original);
  });

  it('lanca erro ao tentar descriptografar texto invalido', () => {
    expect(() => decrypt('invalido')).toThrow();
  });

  it('falha fechado quando JWT_SECRET esta ausente', () => {
    delete process.env.JWT_SECRET;
    expect(() => encrypt('segredo')).toThrow(/JWT_SECRET ausente/);
  });

  it('rejeita fallback publico conhecido', () => {
    process.env.JWT_SECRET = 'default-secret-change-me';
    expect(() => encrypt('segredo')).toThrow(/valor padrão público/);
  });
});
