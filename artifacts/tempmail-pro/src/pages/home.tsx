import { useState, useEffect, useRef } from 'react';
import { useTempMail, EmailDetail, AccountRecord } from '@/hooks/use-tempmail';
import CatMailAnimation from '@/components/CatMailAnimation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Copy,
  RefreshCw,
  Mail,
  Paperclip,
  Download,
  Inbox,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
  History,
  Undo2,
  Search,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import bgImage from '@assets/xxxx_1784040995668.jpg';

// ── tiny glass-card wrapper ────────────────────────────────────────────────
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-white/10 shadow-2xl overflow-hidden ${className}`}
      style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}
    >
      {children}
    </div>
  );
}

// ── relative time helper ───────────────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'baru saja';
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

export default function Home() {
  const {
    address, emails, isLoading, isPolling, history,
    refresh, changeEmail, recoverAccount, fetchEmailDetail, getAttachmentUrl,
  } = useTempMail();

  const { toast } = useToast();
  const [showRecovery,   setShowRecovery]   = useState(false);
  const [recoverySearch, setRecoverySearch] = useState('');
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [emailDetail,    setEmailDetail]    = useState<EmailDetail | null>(null);
  const [isDetailLoad,   setIsDetailLoad]   = useState(false);
  const [recovering,     setRecovering]     = useState<string | null>(null);
  const [showCat,        setShowCat]        = useState(false);
  const [newEmailCount,  setNewEmailCount]  = useState(0);
  const prevEmailCount   = useRef<number>(-1);
  const catTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect newly arrived emails and trigger cat animation
  useEffect(() => {
    if (prevEmailCount.current === -1) {
      // first load — establish baseline silently
      prevEmailCount.current = emails.length;
      return;
    }
    const diff = emails.length - prevEmailCount.current;
    if (diff > 0) {
      setNewEmailCount(diff);
      setShowCat(true);
      if (catTimerRef.current) clearTimeout(catTimerRef.current);
      catTimerRef.current = setTimeout(() => setShowCat(false), 4200);
    }
    prevEmailCount.current = emails.length;
  }, [emails.length]);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast({ title: 'Email disalin!', description: 'Alamat email berhasil disalin ke clipboard.' });
  };

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    setIsDetailLoad(true);
    try { setEmailDetail(await fetchEmailDetail(id)); }
    catch { /* handled in hook */ }
    finally { setIsDetailLoad(false); }
  };

  const handleRecover = async (record: AccountRecord) => {
    setRecovering(record.email);
    setSelectedId(null);
    setEmailDetail(null);
    try { await recoverAccount(record); }
    finally { setRecovering(null); setShowRecovery(false); }
  };

  const handleChangeEmail = () => {
    changeEmail();
    setSelectedId(null);
    setEmailDetail(null);
  };

  // ── loading screen ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="fixed inset-0 bg-black/50" />
        <GlassCard className="relative z-10 p-10 flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw className="h-8 w-8 text-white" />
          </motion.div>
          <p className="text-white font-semibold text-sm tracking-wide">Membuat kotak masuk…</p>
        </GlassCard>
      </div>
    );
  }

  // ── main layout ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] w-full flex flex-col font-sans relative"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>

      {/* global overlay — very light so background art shows through */}
      <div className="fixed inset-0 bg-black/10 pointer-events-none z-0" />

      {/* ── Cat mail animation ─────────────────────────────────────────────── */}
      <CatMailAnimation show={showCat} count={newEmailCount} />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 w-full border-b border-white/10 shadow-sm"
        style={{ background: 'rgba(0,0,0,0.10)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

          {/* Facebook + Twitter — kiri */}
          <div className="hidden sm:flex items-center gap-2">
            <a href="https://www.facebook.com/derby.ar.7" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                         border border-blue-400/40 text-blue-300
                         bg-blue-500/10 hover:bg-blue-500/25
                         shadow-[0_0_12px_rgba(59,130,246,0.2)]
                         hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]
                         transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987H7.898V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
              </svg>
              <span>Facebook</span>
            </a>
            <a href="https://x.com/polkaster300" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold
                         border border-sky-400/40 text-sky-300
                         bg-sky-500/10 hover:bg-sky-500/25
                         shadow-[0_0_12px_rgba(14,165,233,0.2)]
                         hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]
                         transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
              </svg>
              <span>Twitter</span>
            </a>
          </div>

          {/* Judul tengah */}
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold tracking-tight drop-shadow flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
              <span className="rgb-text">TempMail By Polkaster</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">Live</span>
            </div>
          </div>

          {/* Tombol Donate — kanan */}
          <div className="w-36 flex justify-end">
            <a href="https://saweria.co/polkaster" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold
                         border border-yellow-400/50 text-yellow-300
                         bg-yellow-400/10 hover:bg-yellow-400/25
                         shadow-[0_0_12px_rgba(250,204,21,0.25)]
                         hover:shadow-[0_0_20px_rgba(250,204,21,0.45)]
                         transition-all duration-200">
              ☕ <span>Donate</span>
            </a>
          </div>

        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 container mx-auto px-4 py-6 max-w-7xl flex flex-col md:flex-row gap-6">

        {/* Left panel */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col gap-4 shrink-0">

          {/* Email address card */}
          <GlassCard>
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="p-5">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Alamat Email</p>

              <div className="relative">
                <Input
                  readOnly value={address}
                  className="font-mono text-sm md:text-base pr-12 h-12
                             bg-white/10 border-white/20 text-white
                             placeholder:text-white/40 focus-visible:ring-1 focus-visible:ring-teal-400"
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost"
                      className="absolute right-1 top-1 h-10 w-10 text-white/50 hover:text-teal-300 hover:bg-white/10"
                      onClick={handleCopy}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Salin Email</TooltipContent>
                </Tooltip>
              </div>

              <p className="text-xs text-white/40 mt-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Email ini valid hingga <strong className="text-white/70">14 hari</strong> ke depan.
              </p>

              {/* Change email button */}
              <div className="mt-3 pt-3 border-t border-white/10">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full h-9 text-sm
                      border-white/20 text-white/80 bg-white/10
                      hover:bg-white/20 hover:text-white hover:border-white/30">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Ubah Alamat Email
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ubah Alamat Email</AlertDialogTitle>
                      <AlertDialogDescription>
                        Alamat email baru akan dibuat. Email lama tetap tersimpan di riwayat dan bisa dipulihkan kapan saja.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction onClick={handleChangeEmail}
                        className="bg-teal-600 hover:bg-teal-700 text-white">
                        Ubah
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </GlassCard>

          {/* Inbox + Recovery card */}
          <GlassCard className="flex-1 flex flex-col min-h-[400px]">

            {/* Card header: tabs */}
            <div className="p-4 border-b border-white/10 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <button
                    onClick={() => setShowRecovery(false)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      !showRecovery
                        ? 'bg-white/20 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                    }`}>
                    <Inbox className="h-3.5 w-3.5" />
                    Pesan Masuk
                    {emails.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-teal-500/80 text-white text-[10px] font-bold leading-none">
                        {emails.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowRecovery(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      showRecovery
                        ? 'bg-white/20 text-white'
                        : 'text-white/50 hover:text-white/80 hover:bg-white/10'
                    }`}>
                    <History className="h-3.5 w-3.5" />
                    Pemulihan Akun
                    {history.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-500/70 text-white text-[10px] font-bold leading-none">
                        {history.length}
                      </span>
                    )}
                  </button>
                </div>

                {!showRecovery && (
                  <Button size="sm" variant="ghost" onClick={refresh}
                    className="h-8 px-2 text-white/50 hover:text-teal-300 hover:bg-white/10">
                    <RefreshCw className={`h-4 w-4 ${isPolling ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                <AnimatePresence mode="wait">

                  {/* ── Inbox panel ──────────────────────────────────────── */}
                  {!showRecovery && (
                    <motion.div key="inbox" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {emails.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-52 text-center px-4">
                          <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                            <Mail className="h-6 w-6 text-white/30" />
                          </div>
                          <p className="text-sm font-medium text-white/50">Belum ada email masuk.</p>
                          <p className="text-xs text-white/30 mt-1">Menunggu pesan masuk…</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {emails.map((email, i) => (
                            <motion.button key={email.id}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              onClick={() => handleSelect(email.id)}
                              className={`w-full text-left p-3 rounded-xl transition-all border ${
                                selectedId === email.id
                                  ? 'bg-teal-500/25 border-teal-400/50'
                                  : 'bg-white/5 border-transparent hover:bg-white/15 hover:border-white/20'
                              }`}>
                              <div className="flex justify-between items-start gap-2 mb-0.5">
                                <span className={`font-semibold truncate text-sm ${selectedId === email.id ? 'text-teal-300' : 'text-white/90'}`}>
                                  {email.from}
                                </span>
                                <span className="text-[10px] text-white/40 whitespace-nowrap shrink-0">
                                  {new Date(email.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-sm text-white/80 truncate font-medium mb-0.5">
                                {email.subject || '(Tanpa Subjek)'}
                              </p>
                              <p className="text-xs text-white/40 truncate">
                                {email.intro || 'Tidak ada pratinjau'}
                              </p>
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Account Recovery panel ───────────────────────────── */}
                  {showRecovery && (
                    <motion.div key="recovery" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col gap-2 pt-1">

                      {/* Search input */}
                      <div className="relative px-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/35 pointer-events-none" />
                        <Input
                          value={recoverySearch}
                          onChange={e => setRecoverySearch(e.target.value)}
                          placeholder="Cari alamat email lama…"
                          className="pl-8 h-9 text-sm bg-white/8 border-white/15 text-white placeholder:text-white/30
                                     focus-visible:ring-1 focus-visible:ring-purple-400/60"
                        />
                      </div>

                      {/* Results */}
                      {(() => {
                        const q = recoverySearch.trim().toLowerCase();
                        const filtered = history.filter(r =>
                          !q || r.email.toLowerCase().includes(q)
                        );

                        if (history.length === 0) return (
                          <div className="flex flex-col items-center justify-center h-44 text-center px-4">
                            <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center mb-3">
                              <History className="h-6 w-6 text-white/30" />
                            </div>
                            <p className="text-sm font-medium text-white/50">Belum ada riwayat akun.</p>
                            <p className="text-xs text-white/30 mt-1">Akun yang pernah digunakan akan muncul di sini.</p>
                          </div>
                        );

                        if (filtered.length === 0) return (
                          <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                            <Search className="h-8 w-8 text-white/20 mb-2" />
                            <p className="text-sm text-white/40">Tidak ada akun yang cocok.</p>
                          </div>
                        );

                        // Group by date label
                        const groups: Record<string, typeof filtered> = {};
                        filtered.forEach(rec => {
                          const d = new Date(rec.savedAt);
                          const today = new Date();
                          const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
                          let label: string;
                          if (d.toDateString() === today.toDateString()) label = 'Hari ini';
                          else if (d.toDateString() === yesterday.toDateString()) label = 'Kemarin';
                          else label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                          if (!groups[label]) groups[label] = [];
                          groups[label].push(rec);
                        });

                        return (
                          <div className="flex flex-col gap-3">
                            {Object.entries(groups).map(([label, recs]) => (
                              <div key={label}>
                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-1.5">
                                  {label}
                                </p>
                                <div className="flex flex-col gap-1">
                                  {recs.map(rec => {
                                    const isCurrent = rec.email === address;
                                    const isRecovering = recovering === rec.email;
                                    return (
                                      <div key={rec.email}
                                        className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                                          isCurrent
                                            ? 'bg-teal-500/20 border-teal-400/30'
                                            : 'bg-white/5 border-white/8 hover:bg-white/12'
                                        }`}>
                                        <div className="min-w-0 flex-1">
                                          <p className={`text-sm font-mono truncate ${isCurrent ? 'text-teal-300' : 'text-white/80'}`}>
                                            {rec.email}
                                          </p>
                                          <p className="text-[10px] text-white/30 mt-0.5">
                                            {isCurrent
                                              ? '● Sedang aktif'
                                              : new Date(rec.savedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                                            }
                                          </p>
                                        </div>
                                        {!isCurrent && (
                                          <Button size="sm" variant="ghost" disabled={!!recovering}
                                            onClick={() => handleRecover(rec)}
                                            className="shrink-0 h-8 px-2.5 text-xs text-white/60 border border-white/15
                                                       bg-white/8 hover:bg-purple-500/30 hover:text-white hover:border-purple-400/40">
                                            {isRecovering
                                              ? <RefreshCw className="h-3 w-3 animate-spin" />
                                              : <><Undo2 className="h-3 w-3 mr-1" />Pulihkan</>
                                            }
                                          </Button>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>
            </ScrollArea>
          </GlassCard>
        </div>

        {/* Right panel — email reader */}
        <GlassCard className="flex-1 flex flex-col min-h-[500px]">
          {selectedId ? (
            isDetailLoad ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="h-6 w-6 text-teal-400 animate-spin" />
                <p className="text-sm text-white/50">Memuat pesan…</p>
              </div>
            ) : emailDetail ? (
              <div className="flex flex-col h-full">

                {/* Email detail header */}
                <div className="p-6 border-b border-white/10 shrink-0">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">
                      {emailDetail.subject || '(Tanpa Subjek)'}
                    </h2>
                    <span className="shrink-0 flex items-center gap-1.5 text-xs text-amber-300 border border-amber-400/30 bg-amber-400/10 rounded-full px-3 py-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> 14 Hari
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-500/30 flex items-center justify-center shrink-0 border border-teal-400/30">
                        <span className="text-teal-300 font-bold text-lg">
                          {emailDetail.from.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white/90">{emailDetail.from}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          Kepada: <span className="font-mono text-[11px] bg-white/10 px-1.5 py-0.5 rounded text-white/70">{address}</span>
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 text-right">
                      {new Date(emailDetail.date).toLocaleString('id-ID', {
                        weekday: 'long', year: 'numeric', month: 'long',
                        day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {/* Email body */}
                <ScrollArea className="flex-1">
                  <div className="p-6 md:p-8">
                    {emailDetail.htmlBody ? (
                      <div
                        className="prose prose-sm md:prose-base max-w-none
                          prose-headings:text-white prose-p:text-white/80
                          prose-a:text-teal-400 prose-a:no-underline hover:prose-a:underline
                          prose-strong:text-white prose-li:text-white/80
                          prose-img:rounded-xl"
                        dangerouslySetInnerHTML={{ __html: emailDetail.htmlBody }}
                      />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm text-white/75 leading-relaxed">
                        {emailDetail.textBody}
                      </p>
                    )}
                  </div>
                </ScrollArea>

                {/* Attachments */}
                {emailDetail.attachments.length > 0 && (
                  <div className="p-4 border-t border-white/10 shrink-0">
                    <p className="text-sm font-semibold text-white/60 flex items-center gap-2 mb-3">
                      <Paperclip className="h-4 w-4" />
                      Lampiran ({emailDetail.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {emailDetail.attachments.map((file, idx) => (
                        <a key={idx} href={getAttachmentUrl(emailDetail.id, file.id)}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm hover:bg-white/20 transition-colors group">
                          <div className="h-8 w-8 rounded-lg bg-teal-500/30 flex items-center justify-center shrink-0">
                            <Download className="h-4 w-4 text-teal-300 group-hover:scale-110 transition-transform" />
                          </div>
                          <div>
                            <p className="font-medium max-w-[150px] truncate text-white/85">{file.filename}</p>
                            <p className="text-[10px] text-white/40 uppercase">{Math.round(file.size / 1024)} KB</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="h-24 w-24 rounded-full bg-white/10 flex items-center justify-center mb-6">
                <Mail className="h-10 w-10 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2">Pilih email untuk membaca detailnya.</h3>
              <p className="text-sm text-white/30 max-w-sm">
                Email Anda bersifat sementara dan akan otomatis dihapus setelah waktu validasi berakhir.
              </p>
            </div>
          )}
        </GlassCard>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-3 shrink-0 border-t border-white/10"
        style={{ background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(8px)' }}>
        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-white/35 font-medium">
            TempMail By Polkaster &bull; Powered by mail.tm API &bull; Data tersimpan di browser
          </p>
        </div>
      </footer>
    </div>
  );
}
