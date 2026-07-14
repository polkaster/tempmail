import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface EmailListItem {
  id: string;
  from: string;
  subject: string;
  date: string;
  intro: string;
}

export interface Attachment {
  id: string;
  filename: string;
  contentType: string;
  size: number;
}

export interface EmailDetail extends EmailListItem {
  htmlBody: string;
  textBody: string;
  attachments: Attachment[];
}

export interface AccountRecord {
  email: string;
  password: string;
  savedAt: string;
}

interface StoredAccount {
  email: string;
  password: string;
  token: string;
}

const CURRENT_KEY  = 'tempMailData_v2';
const HISTORY_KEY  = 'tempMailHistory';
const API_BASE     = '/api/mail';
const MAX_HISTORY  = 10;

function formatFrom(from: { address: string; name?: string }): string {
  if (from.name && from.name.trim()) return `${from.name} <${from.address}>`;
  return from.address;
}

function loadHistory(): AccountRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as AccountRecord[]) : [];
  } catch { return []; }
}

function saveToHistory(email: string, password: string) {
  const history = loadHistory().filter(h => h.email !== email);
  history.unshift({ email, password, savedAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
}

export function useTempMail() {
  const [account, setAccount]     = useState<StoredAccount | null>(null);
  const [emails,  setEmails]      = useState<EmailListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [history,  setHistory]    = useState<AccountRecord[]>([]);
  const { toast } = useToast();
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string>('');

  // ── helpers ──────────────────────────────────────────────────────────────

  const obtainToken = useCallback(async (email: string, password: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Token exchange failed');
    const data = await res.json() as { token: string };
    return data.token;
  }, []);

  const authedFetch = useCallback(async (
    url: string, email: string, password: string, attempt = 0,
  ): Promise<Response> => {
    const sep = url.includes('?') ? '&' : '?';
    const res = await fetch(`${url}${sep}token=${encodeURIComponent(tokenRef.current)}`);
    if (res.status === 401 && attempt === 0) {
      const fresh = await obtainToken(email, password);
      tokenRef.current = fresh;
      return fetch(`${url}${sep}token=${encodeURIComponent(fresh)}`);
    }
    return res;
  }, [obtainToken]);

  const persistToken = (email: string, password: string, token: string) => {
    tokenRef.current = token;
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ email, password, token }));
  };

  // ── activate an account (set state + kick off polling) ───────────────────

  const activateAccount = useCallback((acc: StoredAccount) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setEmails([]);
    setAccount(acc);
    setHistory(loadHistory());
  }, []);

  // ── init ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    (async () => {
      setHistory(loadHistory());

      // Try to restore the current session from localStorage
      try {
        const raw = localStorage.getItem(CURRENT_KEY);
        if (raw) {
          const acc = JSON.parse(raw) as StoredAccount;
          if (acc.email && acc.password && acc.token) {
            tokenRef.current = acc.token;
            setAccount(acc);
            setIsLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      // Create a fresh account
      try {
        const res = await fetch(`${API_BASE}/create`, { method: 'POST' });
        if (!res.ok) throw new Error();
        const acc = await res.json() as StoredAccount;
        persistToken(acc.email, acc.password, acc.token);
        saveToHistory(acc.email, acc.password);
        setHistory(loadHistory());
        setAccount(acc);
      } catch {
        toast({ title: 'Gagal membuat email sementara', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── polling ───────────────────────────────────────────────────────────────

  const fetchInbox = useCallback(async (showToast = false, acc?: StoredAccount) => {
    const cur = acc ?? account;
    if (!cur) return;
    setIsPolling(true);
    try {
      const res = await authedFetch(`${API_BASE}/messages`, cur.email, cur.password);
      if (!res.ok) throw new Error();

      const raw = await res.json() as Array<{
        id: string; from: { address: string; name?: string };
        subject: string; intro: string; createdAt: string;
      }>;

      const mapped: EmailListItem[] = raw.map(m => ({
        id: m.id, from: formatFrom(m.from),
        subject: m.subject || '', date: m.createdAt, intro: m.intro || '',
      }));

      // Cache messages alongside account data
      try {
        const stored = localStorage.getItem(CURRENT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.emails = mapped;
          localStorage.setItem(CURRENT_KEY, JSON.stringify(parsed));
        }
      } catch { /* ignore */ }

      setEmails(mapped);
      if (showToast) toast({ title: 'Kotak masuk diperbarui' });
    } catch {
      // Offline fallback: load cached messages
      try {
        const stored = localStorage.getItem(CURRENT_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { emails?: EmailListItem[] };
          if (parsed.emails?.length) {
            setEmails(parsed.emails);
            if (showToast) toast({ title: 'Data offline ditampilkan', variant: 'destructive' });
          }
        }
      } catch { /* ignore */ }
    } finally {
      setIsPolling(false);
    }
  }, [account, authedFetch, toast]);

  useEffect(() => {
    if (!account) return;
    fetchInbox(false, account);
    pollRef.current = setInterval(() => fetchInbox(false), 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [account]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── public actions ────────────────────────────────────────────────────────

  const changeEmail = async () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setEmails([]);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const acc = await res.json() as StoredAccount;
      persistToken(acc.email, acc.password, acc.token);
      saveToHistory(acc.email, acc.password);
      setHistory(loadHistory());
      activateAccount(acc);
      toast({ title: 'Alamat email berhasil diubah.' });
    } catch {
      toast({ title: 'Gagal membuat email baru', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /** Recover a past account from history and start receiving emails again */
  const recoverAccount = async (record: AccountRecord) => {
    if (pollRef.current) clearInterval(pollRef.current);
    setEmails([]);
    setIsLoading(true);
    try {
      const token = await obtainToken(record.email, record.password);
      const acc: StoredAccount = { email: record.email, password: record.password, token };
      persistToken(acc.email, acc.password, acc.token);
      // Move recovered account to front of history
      saveToHistory(acc.email, acc.password);
      setHistory(loadHistory());
      activateAccount(acc);
      toast({ title: `Akun dipulihkan: ${record.email}` });
    } catch {
      toast({ title: 'Pemulihan gagal — akun mungkin sudah kedaluwarsa', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailDetail = async (id: string): Promise<EmailDetail | null> => {
    if (!account) return null;
    try {
      const res = await authedFetch(
        `${API_BASE}/message/${encodeURIComponent(id)}`, account.email, account.password,
      );
      if (!res.ok) throw new Error();
      const data = await res.json() as {
        id: string; from: { address: string; name?: string };
        subject: string; createdAt: string; intro: string;
        html: string[]; text: string;
        attachments: Array<{ id: string; filename: string; contentType: string; size: number | { size: number } }>;
      };
      return {
        id: data.id, from: formatFrom(data.from),
        subject: data.subject || '', date: data.createdAt, intro: data.intro || '',
        htmlBody: Array.isArray(data.html) ? data.html.join('') : (data.html || ''),
        textBody: data.text || '',
        attachments: (data.attachments || []).map(a => ({
          id: a.id, filename: a.filename, contentType: a.contentType,
          size: typeof a.size === 'number' ? a.size : (a.size as { size: number }).size ?? 0,
        })),
      };
    } catch {
      toast({ title: 'Gagal memuat detail email', variant: 'destructive' });
      return null;
    }
  };

  const getAttachmentUrl = (msgId: string, attachmentId: string): string =>
    `${API_BASE}/download/${encodeURIComponent(msgId)}/${encodeURIComponent(attachmentId)}` +
    `?token=${encodeURIComponent(tokenRef.current)}`;

  return {
    address: account?.email ?? '',
    emails,
    isLoading,
    isPolling,
    history,
    refresh: () => fetchInbox(true),
    changeEmail,
    recoverAccount,
    fetchEmailDetail,
    getAttachmentUrl,
  };
}
