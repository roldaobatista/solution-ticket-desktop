#!/usr/bin/env node
/**
 * gerar-crl.js
 * Gera uma CRL (Certificate Revocation List) assinada com private.key.
 *
 * Uso:
 *   node gerar-crl.js --revoked <jti1,jti2,...> --version <N>
 *   node gerar-crl.js --revoked '' --version 1   # CRL vazia
 *
 * O backend valida a assinatura com a mesma chave publica usada pelas licencas
 * e rejeita upload com version menor que a versao corrente em disco.
 */
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val =
        argv[i + 1] !== undefined && !String(argv[i + 1]).startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv);

if (args.version === undefined || args.revoked === undefined) {
  console.error('Uso: node gerar-crl.js --revoked <jti1,jti2,...> --version <N>');
  console.error('     node gerar-crl.js --revoked "" --version 1   # CRL vazia');
  process.exit(1);
}

const version = parseInt(args.version, 10);
if (!Number.isFinite(version) || version < 0) {
  console.error('Erro: --version deve ser inteiro >= 0');
  process.exit(1);
}

const revoked = String(args.revoked)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const privatePath = path.join(__dirname, 'private.key');
if (!fs.existsSync(privatePath)) {
  console.error('Erro: private.key nao encontrada. Rode: node gerar-par-rsa.js');
  process.exit(1);
}
const privateKey = fs.readFileSync(privatePath, 'utf8');

const now = Math.floor(Date.now() / 1000);
const payload = {
  iat: now,
  issued_at: new Date(now * 1000).toISOString(),
  version,
  revoked,
};

const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
console.error(`[gerar-crl] versao=${version} revoked=${revoked.length} jti(s)`);
console.log(token);
