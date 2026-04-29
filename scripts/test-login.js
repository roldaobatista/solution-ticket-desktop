const http = require('http');
const data = JSON.stringify({
  email: process.env.ST_TEST_EMAIL || 'admin@solutionticket.com',
  senha: process.env.ST_TEST_PASSWORD || process.env.SEED_DEFAULT_PASSWORD,
  tenantId: process.env.ST_TEST_TENANT_ID,
});
if (!JSON.parse(data).senha) {
  throw new Error('Defina ST_TEST_PASSWORD ou SEED_DEFAULT_PASSWORD para executar o teste');
}
const req = http.request(
  {
    hostname: '127.0.0.1',
    port: 3001,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
  },
  (res) => {
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log(
        'BODY:',
        body.replace(/"accessToken":"[^"]+"/g, '"accessToken":"[REDACTED]"').substring(0, 600),
      );
    });
  },
);
req.on('error', (e) => console.log('ERR:', e.message));
req.write(data);
req.end();
