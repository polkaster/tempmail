// Netlify serverless function — replaces the Express API server for Netlify deploys.
// Handles all /api/mail/* routes by reading event.path.
// CommonJS exports required (no "type":"module" in this directory).

const MAILTM = 'https://api.mail.tm';

async function getToken(address, password) {
  const res = await fetch(`${MAILTM}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  return data.token;
}

function jsonResp(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async function handler(event) {
  const method = event.httpMethod;
  // Strip leading /api so path becomes /mail/create etc.
  const path = (event.path || '').replace(/^\/api/, '');
  const qs = event.queryStringParameters || {};

  // ── CORS preflight ───────────────────────────────────────────────────────
  if (method === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  try {
    // POST /api/mail/create
    if (method === 'POST' && path === '/mail/create') {
      const dr = await fetch(`${MAILTM}/domains`);
      const dd = await dr.json();
      const domain = dd['hydra:member']?.[0]?.domain;
      if (!domain) return jsonResp(502, { error: 'No mail domains available' });

      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let username = '';
      for (let i = 0; i < 10; i++) username += chars[Math.floor(Math.random() * chars.length)];
      const password =
        'Px9!' +
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 6);
      const address = `${username}@${domain}`;

      const ar = await fetch(`${MAILTM}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, password }),
      });
      if (!ar.ok) return jsonResp(502, { error: 'Failed to create mail account' });

      const token = await getToken(address, password);
      return jsonResp(200, { email: address, password, token });
    }

    // POST /api/mail/token
    if (method === 'POST' && path === '/mail/token') {
      const body = JSON.parse(event.body || '{}');
      const { email, password } = body;
      if (!email || !password) return jsonResp(400, { error: 'email and password are required' });
      const token = await getToken(email, password);
      return jsonResp(200, { token });
    }

    // GET /api/mail/messages?token=JWT
    if (method === 'GET' && path === '/mail/messages') {
      const { token } = qs;
      if (!token) return jsonResp(400, { error: 'token is required' });
      const upstream = await fetch(`${MAILTM}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (upstream.status === 401) return jsonResp(401, { error: 'Token expired' });
      if (!upstream.ok) return jsonResp(502, { error: 'Failed to fetch messages' });
      const data = await upstream.json();
      return jsonResp(200, data['hydra:member'] ?? []);
    }

    // GET /api/mail/message/:id?token=JWT
    const msgMatch = path.match(/^\/mail\/message\/([^/]+)$/);
    if (method === 'GET' && msgMatch) {
      const id = msgMatch[1];
      const { token } = qs;
      if (!token) return jsonResp(400, { error: 'token is required' });
      const upstream = await fetch(`${MAILTM}/messages/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (upstream.status === 401) return jsonResp(401, { error: 'Token expired' });
      if (!upstream.ok) return jsonResp(502, { error: 'Failed to fetch message' });
      return jsonResp(200, await upstream.json());
    }

    // GET /api/mail/download/:msgId/:attachmentId?token=JWT
    const dlMatch = path.match(/^\/mail\/download\/([^/]+)\/([^/]+)$/);
    if (method === 'GET' && dlMatch) {
      const [, msgId, attachmentId] = dlMatch;
      const { token } = qs;
      if (!token) return jsonResp(400, { error: 'token is required' });
      const upstream = await fetch(
        `${MAILTM}/messages/${encodeURIComponent(msgId)}/attachment/${encodeURIComponent(attachmentId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!upstream.ok) return jsonResp(502, { error: 'Failed to download attachment' });
      const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
      const disposition = upstream.headers.get('content-disposition');
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          ...(disposition ? { 'Content-Disposition': disposition } : {}),
          'Access-Control-Allow-Origin': '*',
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true,
      };
    }

    return jsonResp(404, { error: 'Not found' });
  } catch (err) {
    console.error('api function error:', err);
    return jsonResp(500, { error: 'Internal server error' });
  }
};
