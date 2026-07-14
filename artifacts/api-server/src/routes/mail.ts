import { Router, type IRouter } from "express";

const router: IRouter = Router();
const MAILTM = "https://api.mail.tm";

// Helper: exchange email+password for a JWT token
async function getToken(address: string, password: string): Promise<string> {
  const res = await fetch(`${MAILTM}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, password }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = (await res.json()) as { token: string };
  return data.token;
}

// POST /api/mail/create
// Creates a new mail.tm account and returns { email, password, token }
router.post("/mail/create", async (req, res) => {
  try {
    // Fetch available domains
    const dr = await fetch(`${MAILTM}/domains`);
    const dd = (await dr.json()) as {
      "hydra:member": { domain: string }[];
    };
    const domain = dd["hydra:member"][0]?.domain;
    if (!domain) {
      res.status(502).json({ error: "No mail domains available" });
      return;
    }

    // Generate random credentials
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let username = "";
    for (let i = 0; i < 10; i++) {
      username += chars[Math.floor(Math.random() * chars.length)];
    }
    const password =
      "Px9!" +
      Math.random().toString(36).slice(2, 10) +
      Math.random().toString(36).slice(2, 6);
    const address = `${username}@${domain}`;

    // Create account
    const ar = await fetch(`${MAILTM}/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, password }),
    });
    if (!ar.ok) {
      const err = await ar.text();
      req.log.error({ err }, "mail.tm account creation failed");
      res.status(502).json({ error: "Failed to create mail account" });
      return;
    }

    // Get token
    const token = await getToken(address, password);

    res.json({ email: address, password, token });
  } catch (err) {
    req.log.error({ err }, "mail/create error");
    res.status(502).json({ error: "Failed to create mail account" });
  }
});

// POST /api/mail/token
// Re-authenticates and returns a fresh { token }
router.post("/mail/token", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  try {
    const token = await getToken(email, password);
    res.json({ token });
  } catch (err) {
    req.log.error({ err }, "mail/token error");
    res.status(401).json({ error: "Authentication failed" });
  }
});

// GET /api/mail/messages?token=JWT
router.get("/mail/messages", async (req, res) => {
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  try {
    const upstream = await fetch(`${MAILTM}/messages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (upstream.status === 401) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (!upstream.ok) throw new Error(`Upstream: ${upstream.status}`);
    const data = (await upstream.json()) as {
      "hydra:member": unknown[];
    };
    // Return just the array to keep the same shape the frontend expects
    res.json(data["hydra:member"] ?? []);
  } catch (err) {
    req.log.error({ err }, "mail/messages error");
    res.status(502).json({ error: "Failed to fetch messages" });
  }
});

// GET /api/mail/message/:id?token=JWT
router.get("/mail/message/:id", async (req, res) => {
  const { id } = req.params;
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  try {
    const upstream = await fetch(`${MAILTM}/messages/${encodeURIComponent(id)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (upstream.status === 401) {
      res.status(401).json({ error: "Token expired" });
      return;
    }
    if (!upstream.ok) throw new Error(`Upstream: ${upstream.status}`);
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    req.log.error({ err }, "mail/message error");
    res.status(502).json({ error: "Failed to fetch message" });
  }
});

// GET /api/mail/download/:msgId/:attachmentId?token=JWT
router.get("/mail/download/:msgId/:attachmentId", async (req, res) => {
  const { msgId, attachmentId } = req.params;
  const { token } = req.query as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  try {
    const upstream = await fetch(
      `${MAILTM}/messages/${encodeURIComponent(msgId)}/attachment/${encodeURIComponent(attachmentId)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!upstream.ok) throw new Error(`Upstream: ${upstream.status}`);
    const contentType =
      upstream.headers.get("content-type") ?? "application/octet-stream";
    const disposition = upstream.headers.get("content-disposition");
    res.setHeader("content-type", contentType);
    if (disposition) res.setHeader("content-disposition", disposition);
    const buffer = await upstream.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    req.log.error({ err }, "mail/download error");
    res.status(502).json({ error: "Failed to download attachment" });
  }
});

export default router;
