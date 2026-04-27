import { encrypt, decrypt } from './crypto.util';

describe('crypto.util', () => {
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
});
