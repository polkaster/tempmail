// Vercel serverless function — handles all /api/mail/* routes.
// Vercel functions receive (req, res) like Express.

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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Strip /api prefix so path becomes /mail/create etc.
  const path = (req.url || '').replace(/^\/api/, '').split('?')[0];
  const qs = req.query || {};

  try {
    // POST /api/mail/create
    if (req.method === 'POST' && path === '/mail/create') {
      const dr = await fetch(`${MAILTM}/domains`);
      const dd = await dr.json();
      const domain = dd['hydra:member']?.[0]?.domain;
      if (!domain) return res.status(502).json({ error: 'No mail domains available' });

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
      if (!ar.ok) return res.status(502).json({ error: 'Failed to create mail account' });

      const token = await getToken(address, password);
      return res.status(200).json({ email: address, password, token });
    }

    // POST /api/mail/token
    if (req.method === 'POST' && path === '/mail/token') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { email, password } = body;
      if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
      const token = await getToken(email, password);
      return res.status(200).json({ token });
    }

    // GET /api/mail/messages?token=JWT
    if (req.method === 'GET' && path === '/mail/messages') {
      const token = qs.token;
      if (!token) return res.status(400).json({ error: 'token is required' });
      const upstream = await fetch(`${MAILTM}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (upstream.status === 401) return res.status(401).json({ error: 'Token expired' });
      if (!upstream.ok) return res.status(502).json({ error: 'Failed to fetch messages' });
      const data = await upstream.json();
      return res.status(200).json(data['hydra:member'] ?? []);
    }

    // GET /api/mail/message/:id?token=JWT
    const msgMatch = path.match(/^\/mail\/message\/([^/]+)$/);
    if (req.method === 'GET' && msgMatch) {
      const id = msgMatch[1];
      const token = qs.token;
      if (!token) return res.status(400).json({ error: 'token is required' });
      const upstream = await fetch(`${MAILTM}/messages/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (upstream.status === 401) return res.status(401).json({ error: 'Token expired' });
      if (!upstream.ok) return res.status(502).json({ error: 'Failed to fetch message' });
      return res.status(200).json(await upstream.json());
    }

    // GET /api/mail/download/:msgId/:attachmentId?token=JWT
    const dlMatch = path.match(/^\/mail\/download\/([^/]+)\/([^/]+)$/);
    if (req.method === 'GET' && dlMatch) {
      const [, msgId, attachmentId] = dlMatch;
      const token = qs.token;
      if (!token) return res.status(400).json({ error: 'token is required' });
      const upstream = await fetch(
        `${MAILTM}/messages/${encodeURIComponent(msgId)}/attachment/${encodeURIComponent(attachmentId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!upstream.ok) return res.status(502).json({ error: 'Failed to download attachment' });
      const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream';
      const disposition = upstream.headers.get('content-disposition');
      res.setHeader('Content-Type', contentType);
      if (disposition) res.setHeader('Content-Disposition', disposition);
      const buffer = Buffer.from(await upstream.arrayBuffer());
      return res.status(200).send(buffer);
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('api handler error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
