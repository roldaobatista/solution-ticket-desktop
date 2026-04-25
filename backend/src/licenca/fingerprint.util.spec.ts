import { obterFingerprint, _resetFingerprintCache } from './fingerprint.util';

describe('fingerprint.util', () => {
  beforeEach(() => _resetFingerprintCache());

  it('gera fingerprint estável (mesma máquina produz mesmo hash)', () => {
    const a = obterFingerprint();
    _resetFingerprintCache();
    const b = obterFingerprint();
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{32}$/);
  });

  it('faz cache após a primeira chamada', () => {
    const a = obterFingerprint();
    const b = obterFingerprint();
    expect(a).toBe(b);
  });

  it('reset do cache continua produzindo o mesmo valor (determinístico)', () => {
    const a = obterFingerprint();
    _resetFingerprintCache();
    const b = obterFingerprint();
    expect(a).toBe(b);
  });
});
