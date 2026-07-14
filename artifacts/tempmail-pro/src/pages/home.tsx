import { useState } from 'react';
import { useTempMail, EmailDetail } from '@/hooks/use-tempmail';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Search,
  Inbox,
  ShieldCheck,
  Clock,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import bgImage from '@assets/xxxx_1784040995668.jpg';

export default function Home() {
  const {
    address,
    emails,
    isLoading,
    isPolling,
    refresh,
    clearData,
    fetchEmailDetail,
    getAttachmentUrl,
  } = useTempMail();

  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const filteredEmails = emails.filter(
    (email) =>
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({ title: 'Email disalin!', description: 'Alamat email berhasil disalin ke clipboard.' });
    }
  };

  const handleSelectEmail = async (id: string) => {
    setSelectedEmailId(id);
    setIsDetailLoading(true);
    try {
      const detail = await fetchEmailDetail(id);
      setEmailDetail(detail);
    } catch {
      // handled in hook
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleChangeEmail = () => {
    clearData();
    setSelectedEmailId(null);
    setEmailDetail(null);
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center"
        style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-8 flex flex-col items-center gap-4">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw className="h-8 w-8 text-white" />
          </motion.div>
          <p className="text-white font-semibold text-sm">Membuat kotak masuk Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] w-full flex flex-col font-sans"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}
    >
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/40 pointer-events-none z-0" />

      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-black/30 backdrop-blur-md border-b border-white/10 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center relative">
          {/* Centered title */}
          <div className="flex flex-col items-center">
            <h1 className="text-xl font-bold tracking-tight text-white drop-shadow flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              TempMail By Polkaster
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 container mx-auto px-4 py-6 max-w-7xl flex flex-col md:flex-row gap-6">

        {/* Left Panel */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col gap-4 shrink-0">

          {/* Email Address Card */}
          <Card className="border-white/20 shadow-lg bg-white/80 backdrop-blur-md overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500"></div>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Alamat Email</h2>

              {/* Email input + copy button */}
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <Input
                    readOnly
                    value={address}
                    className="font-mono text-base bg-white/70 border-slate-200 pr-12 focus-visible:ring-1 focus-visible:ring-teal-400 h-12"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1 h-10 w-10 text-slate-400 hover:text-teal-600 hover:bg-teal-50"
                        onClick={handleCopy}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Salin Email</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Email ini valid hingga <strong className="text-slate-700">14 hari</strong> ke depan.</span>
              </p>

              {/* Change email button — placed right below the address */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-9 text-sm border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Ubah Alamat Email
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Ubah Alamat Email</AlertDialogTitle>
                      <AlertDialogDescription>
                        Alamat email baru akan dibuat dan semua pesan saat ini akan terhapus. Lanjutkan?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleChangeEmail}
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Ubah
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>

          {/* Inbox Container */}
          <Card className="flex-1 flex flex-col border-white/20 shadow-lg bg-white/80 backdrop-blur-md overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-teal-600" />
                  Pesan Masuk
                  <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0.5 text-xs font-normal">
                    {emails.length}
                  </Badge>
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={refresh}
                  className="h-8 px-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isPolling ? 'animate-spin' : ''}`} />
                  Segarkan
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari email berdasarkan pengirim atau subjek..."
                  className="pl-9 h-9 bg-white/70 border-slate-200 focus-visible:ring-1 focus-visible:ring-teal-400 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-2">
                <AnimatePresence>
                  {filteredEmails.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-48 text-center px-4"
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                        <Mail className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-500">
                        {searchQuery ? 'Tidak ada email yang cocok dengan pencarian.' : 'Belum ada email masuk.'}
                      </p>
                      {!searchQuery && (
                        <p className="text-xs text-slate-400 mt-1">Menunggu pesan masuk...</p>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {filteredEmails.map((email, index) => (
                        <motion.button
                          key={email.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectEmail(email.id)}
                          className={`w-full text-left p-3 rounded-lg transition-all border ${
                            selectedEmailId === email.id
                              ? 'bg-teal-50 border-teal-300 shadow-sm'
                              : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className={`font-medium truncate text-sm ${selectedEmailId === email.id ? 'text-teal-700' : 'text-slate-700'}`}>
                              {email.from}
                            </span>
                            <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0 mt-0.5">
                              {new Date(email.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-700 truncate mb-1">
                            {email.subject || '(Tanpa Subjek)'}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {email.intro || 'Tidak ada pratinjau tersedia.'}
                          </p>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Right Panel */}
        <Card className="flex-1 flex flex-col border-white/20 shadow-lg bg-white/80 backdrop-blur-md overflow-hidden min-h-[500px]">
          {selectedEmailId ? (
            isDetailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <RefreshCw className="h-6 w-6 text-teal-500 animate-spin mb-4" />
                <p className="text-sm text-slate-500">Memuat pesan...</p>
              </div>
            ) : emailDetail ? (
              <div className="flex flex-col h-full">
                {/* Email Header */}
                <div className="p-6 border-b border-slate-100 shrink-0 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                      {emailDetail.subject || '(Tanpa Subjek)'}
                    </h2>
                    <Badge variant="outline" className="shrink-0 bg-amber-50 text-amber-600 border-amber-200 px-3 py-1 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Valid hingga 14 Hari
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center shrink-0 border border-teal-200">
                        <span className="text-teal-700 font-bold text-lg">
                          {emailDetail.from.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{emailDetail.from}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          Kepada:{' '}
                          <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                            {address}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 font-medium text-right">
                      {new Date(emailDetail.date).toLocaleString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <ScrollArea className="flex-1 bg-white">
                  <div className="p-6 md:p-8">
                    {emailDetail.htmlBody ? (
                      <div
                        className="prose prose-sm md:prose-base max-w-none prose-a:text-teal-600 prose-a:no-underline hover:prose-a:underline prose-headings:font-semibold prose-img:rounded-md"
                        dangerouslySetInnerHTML={{ __html: emailDetail.htmlBody }}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap font-sans text-sm md:text-base text-slate-700 leading-relaxed">
                        {emailDetail.textBody}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Attachments Footer */}
                {emailDetail.attachments && emailDetail.attachments.length > 0 && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
                    <p className="text-sm font-semibold flex items-center gap-2 mb-3 text-slate-700">
                      <Paperclip className="h-4 w-4 text-slate-400" />
                      Lampiran ({emailDetail.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {emailDetail.attachments.map((file, idx) => (
                        <a
                          key={idx}
                          href={getAttachmentUrl(emailDetail.id, file.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-2 text-sm hover:bg-slate-50 transition-colors group shadow-sm"
                        >
                          <div className="h-8 w-8 rounded bg-teal-50 flex items-center justify-center shrink-0">
                            <Download className="h-4 w-4 text-teal-600 group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium max-w-[150px] truncate text-slate-700">{file.filename}</span>
                            <span className="text-[10px] text-slate-400 uppercase">
                              {Math.round(file.size / 1024)} KB
                            </span>
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
              <div className="h-24 w-24 rounded-full bg-slate-100/80 flex items-center justify-center mb-6">
                <Mail className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">Pilih email untuk membaca detailnya.</h3>
              <p className="text-sm text-slate-400 max-w-sm">
                Email Anda bersifat sementara dan akan otomatis dihapus oleh sistem setelah waktu validasi berakhir.
              </p>
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center shrink-0 bg-black/30 backdrop-blur-md border-t border-white/10">
        <p className="text-xs text-white/60 font-medium">
          TempMail By Polkaster &bull; Dibuat dengan mail.tm API &bull; Data tersimpan di browser
        </p>
      </footer>
    </div>
  );
}
