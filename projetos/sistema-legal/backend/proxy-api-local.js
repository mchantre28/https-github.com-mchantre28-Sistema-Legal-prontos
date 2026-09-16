/**
 * Ponte local :3001 → API de produção.
 * Permite o login em http://localhost:8000 sem DATABASE_URL neste PC.
 */
const http = require('http');
const https = require('https');

const PORT = Number(process.env.PORT || 3001);
const TARGET_HOST = process.env.API_PROXY_HOST || 'sistema-legal-api-eu.onrender.com';

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: TARGET_HOST };
  delete headers.connection;

  const proxy = https.request({
    hostname: TARGET_HOST,
    path: req.url,
    method: req.method,
    headers,
  }, (incoming) => {
    res.writeHead(incoming.statusCode || 502, incoming.headers);
    incoming.pipe(res);
  });

  proxy.on('error', (err) => {
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
    }
    res.end(JSON.stringify({ erro: 'Falha ao contactar a API: ' + err.message }));
  });

  req.pipe(proxy);
});

server.listen(PORT, () => {
  console.log(`Ponte API http://localhost:${PORT} → https://${TARGET_HOST}`);
});
