#!/usr/bin/env node
/**
 * gerar-par-rsa.js
 * Gera um par RSA-2048 (private.key + public.key) no diretorio do keygen.
 * private.key nao deve ser commitada (ver .gitignore).
 */
const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const PRIVATE_PATH = path.join(DIR, 'private.key');
const PUBLIC_PATH = path.join(DIR, 'public.key');

if (fs.existsSync(PRIVATE_PATH) || fs.existsSync(PUBLIC_PATH)) {
  const force = process.argv.includes('--force');
  if (!force) {
    console.error('Erro: private.key ou public.key ja existe. Use --force para sobrescrever.');
    process.exit(1);
  }
}

console.log('Gerando par RSA-2048...');
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(PRIVATE_PATH, privateKey, { mode: 0o600 });
fs.writeFileSync(PUBLIC_PATH, publicKey);

console.log('OK:');
console.log('  ' + PRIVATE_PATH + ' (NAO COMMITAR)');
console.log('  ' + PUBLIC_PATH + ' (copiar para backend/src/licenca/public.key)');
