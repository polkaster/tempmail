import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface EmailListItem {
  id: string;
  from: string;          // display string e.g. "Name <addr>"
  subject: string;
  date: string;          // ISO date string
  intro: string;         // short preview text
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

interface StoredAccount {
  email: string;
  password: string;
  token: string;
}

const LOCAL_STORAGE_KEY = 'tempMailData_v2';
const API_BASE = '/api/mail';

function formatFrom(from: { address: string; name?: string }): string {
  if (from.name && from.name.trim()) return `${from.name} <${from.address}>`;
  return from.address;
}

export function useTempMail() {
  const [account, setAccount] = useState<StoredAccount | null>(null);
  const [emails, setEmails] = useState<EmailListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const { toast } = useToast();
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string>('');

  // Re-authenticate and get a fresh token
  const refreshToken = useCallback(async (email: string, password: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Token refresh failed');
    const data = await res.json() as { token: string };
    tokenRef.current = data.token;
    // Persist updated token
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as StoredAccount;
        parsed.token = data.token;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
      } catch { /* ignore */ }
    }
    return data.token;
  }, []);

  // Fetch with automatic token refresh on 401
  const authedFetch = useCallback(async (
    url: string,
    email: string,
    password: string,
    attempt = 0
  ): Promise<Response> => {
    const token = tokenRef.current;
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`);
    if (res.status === 401 && attempt === 0) {
      // Refresh and retry once
      const newToken = await refreshToken(email, password);
      const retryUrl = `${url}${url.includes('?') ? '&' : '?'}token=${encodeURIComponent(newToken)}`;
      return fetch(retryUrl);
    }
    return res;
  }, [refreshToken]);

  // Initialize: load from localStorage or create new account
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const acc = JSON.parse(stored) as StoredAccount;
          if (acc.email && acc.password && acc.token) {
            tokenRef.current = acc.token;
            setAccount(acc);
            setIsLoading(false);
            return;
          }
        }
      } catch { /* ignore */ }

      // Create new account
      try {
        const res = await fetch(`${API_BASE}/create`, { method: 'POST' });
        if (!res.ok) throw new Error('Account creation failed');
        const acc = await res.json() as StoredAccount;
        tokenRef.current = acc.token;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(acc));
        setAccount(acc);
      } catch (err) {
        toast({ title: 'Gagal membuat email sementara', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [toast]);

  const fetchInbox = useCallback(async (showToast = false, acc?: StoredAccount) => {
    const current = acc ?? account;
    if (!current) return;
    try {
      setIsPolling(true);
      const res = await authedFetch(`${API_BASE}/messages`, current.email, current.password);
      if (!res.ok) throw new Error('Fetch messages failed');
      const raw = await res.json() as Array<{
        id: string;
        from: { address: string; name?: string };
        subject: string;
        intro: string;
        createdAt: string;
      }>;

      const mapped: EmailListItem[] = raw.map(m => ({
        id: m.id,
        from: formatFrom(m.from),
        subject: m.subject || '',
        date: m.createdAt,
        intro: m.intro || '',
      }));

      // Cache in localStorage
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredAccount & { emails?: EmailListItem[] };
          parsed.emails = mapped;
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(parsed));
        }
      } catch { /* ignore */ }

      setEmails(mapped);
      if (showToast) toast({ title: 'Kotak masuk diperbarui' });
    } catch {
      setIsPolling(false);
      // Offline fallback
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { emails?: EmailListItem[] };
          if (parsed.emails) {
            setEmails(parsed.emails);
            if (showToast) toast({ title: 'Menggunakan data offline (terputus)', variant: 'destructive' });
          }
        }
      } catch { /* ignore */ }
      return;
    } finally {
      setIsPolling(false);
    }
  }, [account, authedFetch, toast]);

  // Start polling once account is ready
  useEffect(() => {
    if (!account) return;
    fetchInbox(false, account);
    pollIntervalRef.current = setInterval(() => fetchInbox(false), 5000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [account]); // eslint-disable-line react-hooks/exhaustive-deps

  const clearData = async () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setEmails([]);
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/create`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const acc = await res.json() as StoredAccount;
      tokenRef.current = acc.token;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(acc));
      setAccount(acc);
      toast({ title: 'Semua data berhasil dihapus.', variant: 'destructive' });
      pollIntervalRef.current = setInterval(() => fetchInbox(false), 5000);
    } catch {
      toast({ title: 'Gagal membuat email baru', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEmailDetail = async (id: string): Promise<EmailDetail | null> => {
    if (!account) return null;
    try {
      const res = await authedFetch(`${API_BASE}/message/${encodeURIComponent(id)}`, account.email, account.password);
      if (!res.ok) throw new Error();
      const data = await res.json() as {
        id: string;
        from: { address: string; name?: string };
        subject: string;
        createdAt: string;
        intro: string;
        html: string[];
        text: string;
        attachments: Array<{ id: string; filename: string; contentType: string; size: { size: number } | number }>;
      };
      return {
        id: data.id,
        from: formatFrom(data.from),
        subject: data.subject || '',
        date: data.createdAt,
        intro: data.intro || '',
        htmlBody: Array.isArray(data.html) ? data.html.join('') : (data.html || ''),
        textBody: data.text || '',
        attachments: (data.attachments || []).map(a => ({
          id: a.id,
          filename: a.filename,
          contentType: a.contentType,
          size: typeof a.size === 'number' ? a.size : (a.size as { size: number }).size ?? 0,
        })),
      };
    } catch {
      toast({ title: 'Gagal memuat detail email', variant: 'destructive' });
      return null;
    }
  };

  const getAttachmentUrl = (msgId: string, attachmentId: string): string => {
    const token = tokenRef.current;
    return `${API_BASE}/download/${encodeURIComponent(msgId)}/${encodeURIComponent(attachmentId)}?token=${encodeURIComponent(token)}`;
  };

  return {
    address: account?.email ?? '',
    emails,
    isLoading,
    isPolling,
    refresh: () => fetchInbox(true),
    clearData,
    fetchEmailDetail,
    getAttachmentUrl,
  };
}
