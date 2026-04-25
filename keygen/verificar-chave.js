#!/usr/bin/env node
/**
 * verificar-chave.js
 * Decodifica e valida assinatura de uma chave JWT com public.key.
 *
 * Uso: node verificar-chave.js --chave <JWT>
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
if (!args.chave) {
  console.error('Uso: node verificar-chave.js --chave <JWT>');
  process.exit(1);
}

const publicPath = path.join(__dirname, 'public.key');
if (!fs.existsSync(publicPath)) {
  console.error('Erro: public.key nao encontrada. Rode: node gerar-par-rsa.js');
  process.exit(1);
}
const publicKey = fs.readFileSync(publicPath, 'utf8');

try {
  const decoded = jwt.verify(args.chave, publicKey, { algorithms: ['RS256'] });
  console.log('Assinatura VALIDA');
  console.log('Payload:');
  console.log(JSON.stringify(decoded, null, 2));
  if (decoded.exp) {
    const dt = new Date(decoded.exp * 1000);
    console.log('Expira em: ' + dt.toISOString());
  } else {
    console.log('Expira em: (vitalicia)');
  }
} catch (e) {
  console.error('Assinatura INVALIDA: ' + e.message);
  process.exit(2);
}
