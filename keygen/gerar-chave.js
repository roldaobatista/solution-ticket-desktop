#!/usr/bin/env node
/**
 * gerar-chave.js
 * Gera um JWT RS256 assinado com private.key.
 *
 * Uso:
 *   node gerar-chave.js --fingerprint <fp1,fp2,...> --plano PADRAO|PRO [--maquinas N] [--validade-dias N]
 *
 * Notas:
 *   - PADRAO: 1 maquina (1 fingerprint)
 *   - PRO:    ate 3 maquinas (ate 3 fingerprints)
 *   - Sem --validade-dias -> licenca vitalicia (sem exp no JWT)
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
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      out[key] = val;
    }
  }
  return out;
}

const args = parseArgs(process.argv);

if (!args.fingerprint || !args.plano) {
  console.error(
    'Uso: node gerar-chave.js --fingerprint <fp1[,fp2,fp3]> --plano PADRAO|PRO [--maquinas N] [--validade-dias N]',
  );
  process.exit(1);
}

const plano = String(args.plano).toUpperCase();
if (!['PADRAO', 'PRO'].includes(plano)) {
  console.error('Erro: --plano deve ser PADRAO ou PRO');
  process.exit(1);
}

const fingerprints = String(args.fingerprint)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const maquinas = args.maquinas ? parseInt(args.maquinas, 10) : fingerprints.length || 1;

if (plano === 'PADRAO' && maquinas > 1) {
  console.error('Erro: plano PADRAO permite apenas 1 maquina');
  process.exit(1);
}
if (plano === 'PRO' && maquinas > 3) {
  console.error('Erro: plano PRO permite no maximo 3 maquinas');
  process.exit(1);
}
if (fingerprints.length > maquinas) {
  console.error(`Erro: ${fingerprints.length} fingerprints informadas, mas limite e ${maquinas}`);
  process.exit(1);
}

const privatePath = path.join(__dirname, 'private.key');
if (!fs.existsSync(privatePath)) {
  console.error('Erro: private.key nao encontrada. Rode: node gerar-par-rsa.js');
  process.exit(1);
}
const privateKey = fs.readFileSync(privatePath, 'utf8');

const now = Math.floor(Date.now() / 1000);
const payload = {
  fingerprints,
  plan: plano,
  maxMaquinas: maquinas,
  iat: now,
  version: 1,
};

const signOptions = { algorithm: 'RS256' };
if (args['validade-dias'] && args['validade-dias'] !== 'true') {
  const dias = parseInt(args['validade-dias'], 10);
  if (!Number.isFinite(dias) || dias <= 0) {
    console.error('Erro: --validade-dias deve ser um inteiro > 0');
    process.exit(1);
  }
  payload.exp = now + dias * 86400;
}

const token = jwt.sign(payload, privateKey, signOptions);
console.log(token);
