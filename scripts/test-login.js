const http = require('http');
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
    let body = '';
    res.on('data', (c) => (body += c));
    res.on('end', () => {
      console.log('STATUS:', res.statusCode);
      console.log('BODY:', body.substring(0, 600));
    });
  },
);
req.on('error', (e) => console.log('ERR:', e.message));
req.write(data);
req.end();
