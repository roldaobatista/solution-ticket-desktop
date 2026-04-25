const http = require('http');
function login() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ email: 'admin@solutionticket.com', senha: '123456' });
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(b);
            const tok = parsed.data?.accessToken || parsed.accessToken;
            resolve(tok);
          } catch {
            reject(b);
          }
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}
async function get(path, token) {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path,
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let b = '';
        res.on('data', (c) => (b += c));
        res.on('end', () => resolve({ status: res.statusCode, body: b.substring(0, 500) }));
      },
    );
    req.on('error', (e) => resolve({ status: 0, body: e.message }));
    req.end();
  });
}
(async () => {
  const tok = await login();
  console.log('Token obtido');
  const r = await get('/api/romaneios', tok);
  console.log('GET /romaneios STATUS:', r.status);
  console.log('BODY:', r.body);
})();
