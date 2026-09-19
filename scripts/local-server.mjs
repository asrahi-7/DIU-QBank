import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { request as httpsRequest } from 'node:https';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const preferredPort = Number(process.env.PORT || 8787);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf'
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers
  });
  res.end(body);
}

function proxyGet(target, res) {
  const allowed = [
    'https://diuqbank.com/',
    'https://diuqbank-com.sgp1.cdn.digitaloceanspaces.com/',
    'https://firebasestorage.googleapis.com/',
    'https://storage.googleapis.com/'
  ];
  if (!allowed.some(prefix => target.startsWith(prefix))) {
    send(res, 400, 'Unsupported proxy target');
    return;
  }

  const req = httpsRequest(target, {
    headers: {
      'User-Agent': 'Mozilla/5.0 DIU-QBank-local-viewer',
      'Referer': 'https://diuqbank.com/'
    }
  }, upstream => {
    res.writeHead(upstream.statusCode || 502, {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': target.toLowerCase().split('?', 1)[0].endsWith('.pdf')
        ? 'application/pdf'
        : upstream.headers['content-type'] || 'application/octet-stream',
      'Content-Disposition': 'inline'
    });
    upstream.pipe(res);
  });
  req.on('error', error => send(res, 502, `Proxy fetch failed: ${error.message}`));
  req.end();
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function aiProxy(req, res) {
  try {
    const payload = JSON.parse(await readBody(req) || '{}');
    const { provider, key, prompt, model } = payload;
    if (!['groq', 'openai', 'anthropic'].includes(provider) || !key || !prompt) {
      send(res, 400, JSON.stringify({ error: 'Missing provider, key, or prompt' }), { 'Content-Type': types['.json'] });
      return;
    }

    const config = provider === 'anthropic'
      ? {
          url: 'https://api.anthropic.com/v1/messages',
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
          body: { model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }
        }
      : {
          url: provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions',
          headers: { Authorization: `Bearer ${key}` },
          body: { model, max_tokens: 1500, messages: [{ role: 'user', content: prompt }] }
        };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify(config.body)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `HTTP ${response.status}`);
    const text = provider === 'anthropic'
      ? (data.content || [{}])[0].text
      : (data.choices || [{}])[0]?.message?.content;
    send(res, 200, JSON.stringify({ text: text || 'No response.' }), { 'Content-Type': types['.json'] });
  } catch (error) {
    send(res, 502, JSON.stringify({ error: error.message }), { 'Content-Type': types['.json'] });
  }
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, '');
  const currentPort = server.address()?.port || preferredPort;
  const url = new URL(req.url || '/', `http://127.0.0.1:${currentPort}`);

  if (url.pathname === '/proxy') return proxyGet(url.searchParams.get('url') || '', res);
  if (url.pathname === '/ai-proxy' && req.method === 'POST') return aiProxy(req, res);

  const safePath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const filePath = resolve(join(root, safePath === '/' ? 'index.html' : safePath));
  if (!filePath.startsWith(root) || !existsSync(filePath)) return send(res, 404, 'Not found');

  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': types[extname(filePath).toLowerCase()] || 'application/octet-stream'
  });
  createReadStream(filePath).pipe(res);
});

function listen(port) {
  server.once('error', error => {
    if (error.code === 'EADDRINUSE' && port < preferredPort + 20) {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`DIU QBank running at http://127.0.0.1:${port}/index.html`);
  });
}

listen(preferredPort);
