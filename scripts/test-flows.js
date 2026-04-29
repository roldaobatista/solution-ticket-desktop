// Teste completo de fluxos — simula um usuário humano clicando pelo app.
// Roda contra backend local http://127.0.0.1:3001/api

const http = require('http');

const BASE = '127.0.0.1';
const PORT = 3001;
const TEST_EMAIL = process.env.ST_TEST_EMAIL || 'admin@solutionticket.com';
const TEST_PASSWORD = process.env.ST_TEST_PASSWORD || process.env.SEED_DEFAULT_PASSWORD;
if (!TEST_PASSWORD) {
  throw new Error('Defina ST_TEST_PASSWORD ou SEED_DEFAULT_PASSWORD para executar os fluxos');
}
let token = '';
let tenantId = '';
let unidadeId = '';

const results = [];

function req(method, path, body, extraHeaders) {
  return new Promise((resolve) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE,
      port: PORT,
      path: '/api' + path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(extraHeaders || {}),
      },
    };
    const r = http.request(options, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(buf);
        } catch {
          parsed = buf;
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', (e) => resolve({ status: 0, body: { error: e.message } }));
    if (data) r.write(data);
    r.end();
  });
}

function unwrap(r) {
  if (r.body && typeof r.body === 'object' && 'success' in r.body && 'data' in r.body) {
    return r.body.data;
  }
  return r.body;
}

async function step(name, fn) {
  try {
    const out = await fn();
    const ok = out !== false && out !== null && out !== undefined;
    results.push({ name, ok, info: typeof out === 'string' ? out : '' });
    console.log(`${ok ? 'OK  ' : 'FAIL'}  ${name}${typeof out === 'string' ? ' — ' + out : ''}`);
    return ok;
  } catch (e) {
    results.push({ name, ok: false, info: e.message });
    console.log(`FAIL  ${name} — ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n=== FLUXO 1: AUTH ===');

  await step('Health check', async () => {
    const r = await req('GET', '/health');
    return r.status === 200 ? 'db ' + unwrap(r).services.database : false;
  });

  await step('Login admin', async () => {
    const r = await req('POST', '/auth/login', {
      email: TEST_EMAIL,
      senha: TEST_PASSWORD,
      tenantId: process.env.ST_TEST_TENANT_ID,
    });
    if (r.status !== 201 && r.status !== 200) return false;
    const data = unwrap(r);
    token = data.accessToken || data.access_token || '';
    tenantId = data.usuario?.tenantId || '';
    return token ? 'token emitido' : false;
  });

  await step('Login senha errada retorna 401', async () => {
    const tmp = token;
    token = '';
    const r = await req('POST', '/auth/login', {
      email: TEST_EMAIL,
      senha: 'errada',
      tenantId: process.env.ST_TEST_TENANT_ID,
    });
    token = tmp;
    return r.status === 401 || r.status === 400;
  });

  console.log('\n=== FLUXO 2: DASHBOARD / EMPRESA / UNIDADES ===');

  await step('Buscar empresa', async () => {
    const r = await req('GET', '/empresa');
    const d = unwrap(r);
    return r.status === 200 && d ? `empresa: ${d.nomeEmpresarial || d.nome || 'sem nome'}` : false;
  });

  await step('Buscar unidades', async () => {
    const r = await req('GET', '/empresa/unidades');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    if (lista.length === 0) return false;
    unidadeId = lista[0].id;
    return `${lista.length} unidades, primeira: ${lista[0].nome}`;
  });

  await step('Dashboard KPIs', async () => {
    const r = await req('GET', `/dashboard/kpis/${unidadeId}`);
    return r.status === 200 ? 'kpis carregados' : false;
  });

  console.log('\n=== FLUXO 3: CADASTROS (CRUD clientes) ===');

  let clienteId = '';
  await step('Listar clientes', async () => {
    const r = await req('GET', '/cadastros/clientes');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    return `${lista.length} clientes`;
  });

  await step('Criar cliente', async () => {
    const r = await req('POST', '/cadastros/clientes', {
      tenantId,
      razaoSocial: 'Cliente Teste Flow ' + Date.now(),
      documento: '12345678000199',
      cidade: 'São Paulo',
      uf: 'SP',
    });
    const d = unwrap(r);
    clienteId = d?.id || '';
    return clienteId ? 'id ' + clienteId : false;
  });

  await step('Atualizar cliente', async () => {
    if (!clienteId) return false;
    const r = await req('PATCH', `/cadastros/clientes/${clienteId}`, { cidade: 'Rio de Janeiro' });
    return r.status === 200;
  });

  await step('Deletar cliente', async () => {
    if (!clienteId) return false;
    const r = await req('DELETE', `/cadastros/clientes/${clienteId}`);
    return r.status === 200 || r.status === 204;
  });

  console.log('\n=== FLUXO 4: BALANÇAS & INDICADORES ===');

  let balancaId = '';
  await step('Listar indicadores (12 modelos seed)', async () => {
    const r = await req('GET', '/cadastros/indicadores');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    return `${lista.length} indicadores`;
  });

  await step('Listar balanças', async () => {
    const r = await req('GET', '/balancas');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    if (lista.length > 0) balancaId = lista[0].id;
    return `${lista.length} balanças`;
  });

  if (balancaId) {
    await step('GET status balança', async () => {
      const r = await req('GET', `/balancas/${balancaId}/status`);
      return r.status === 200 ? JSON.stringify(unwrap(r)).substring(0, 80) : false;
    });

    await step('POST testar balança', async () => {
      const r = await req('POST', `/balancas/${balancaId}/testar`);
      return r.status === 200 || r.status === 201;
    });
  }

  console.log('\n=== FLUXO 5: LICENÇA ===');

  await step('GET fingerprint', async () => {
    const r = await req('GET', '/licenca/fingerprint');
    const d = unwrap(r);
    return d?.fingerprint ? 'fp ' + d.fingerprint.substring(0, 16) + '...' : false;
  });

  await step('POST iniciar-trial', async () => {
    const r = await req('POST', '/licenca/iniciar-trial', { unidadeId, tenantId });
    return r.status === 200 || r.status === 201;
  });

  await step('GET status licença', async () => {
    const r = await req('GET', `/licenca/status?unidadeId=${unidadeId}`);
    const d = unwrap(r);
    return d?.status ? `status=${d.status}` : r.status === 200 ? 'ok' : false;
  });

  console.log('\n=== FLUXO 6: TICKETS DE PESAGEM ===');

  await step('Listar tickets', async () => {
    const r = await req('GET', '/tickets');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    return `${lista.length} tickets`;
  });

  await step('Listar fechados', async () => {
    const r = await req('GET', '/tickets?status=FECHADO');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    return `${lista.length} fechados`;
  });

  console.log('\n=== FLUXO 7: FINANCEIRO ===');

  await step('Listar faturas', async () => {
    const r = await req('GET', '/faturas');
    const d = unwrap(r);
    const lista = Array.isArray(d) ? d : d?.data || [];
    return `${lista.length} faturas`;
  });

  console.log('\n=== FLUXO 8: RELATÓRIOS ===');

  await step('Relatório movimento', async () => {
    const r = await req('GET', `/relatorios/movimento?unidadeId=${unidadeId}`);
    return r.status === 200;
  });

  await step('Relatório alteradas', async () => {
    const r = await req('GET', `/relatorios/alteradas?unidadeId=${unidadeId}`);
    return r.status === 200;
  });

  await step('Relatório canceladas', async () => {
    const r = await req('GET', `/relatorios/canceladas?unidadeId=${unidadeId}`);
    return r.status === 200;
  });

  console.log('\n=== FLUXO 9: /auth/me (verifica token) ===');

  await step('GET /auth/me', async () => {
    const r = await req('GET', '/auth/me');
    const d = unwrap(r);
    return r.status === 200 && d ? `logado como ${d.email || d.nome}` : false;
  });

  // Sumário
  console.log('\n\n=== SUMÁRIO ===');
  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;
  console.log(`${ok} OK / ${fail} FAIL de ${results.length} testes`);
  if (fail > 0) {
    console.log('\nFalhas:');
    results.filter((r) => !r.ok).forEach((r) => console.log(`  - ${r.name}: ${r.info}`));
  }
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
