/**
 * Par RSA gerado dinamicamente a cada run dos testes.
 * Evita commitar chaves privadas.
 */
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

export const TEST_PRIVATE_KEY = privateKey;
export const TEST_PUBLIC_KEY = publicKey;

// Chave pública diferente (para teste de assinatura inválida)
const outro = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
export const OUTRA_PRIVATE_KEY = outro.privateKey;
export const OUTRA_PUBLIC_KEY = outro.publicKey;

export interface GerarChaveOptions {
  fingerprints: string[];
  plan?: 'PADRAO' | 'PRO';
  maxMaquinas?: number;
  validadeSegundos?: number | null; // null = vitalícia
  privateKey?: string;
}

export function gerarChaveRSA(opts: GerarChaveOptions): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: Record<string, unknown> = {
    fingerprints: opts.fingerprints,
    plan: opts.plan ?? 'PADRAO',
    maxMaquinas: opts.maxMaquinas ?? opts.fingerprints.length,
    iat: now,
    version: 1,
  };
  if (opts.validadeSegundos != null) {
    payload.exp = now + opts.validadeSegundos;
  }
  return jwt.sign(payload, opts.privateKey ?? TEST_PRIVATE_KEY, { algorithm: 'RS256' });
}
