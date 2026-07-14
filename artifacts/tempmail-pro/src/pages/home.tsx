import { useEffect, useState } from 'react';
import { useTempMail, EmailListItem, EmailDetail } from '@/hooks/use-tempmail';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Trash2, 
  Mail, 
  Paperclip, 
  Download, 
  Search, 
  Inbox,
  ShieldCheck,
  ChevronRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const { 
    address, 
    emails, 
    isLoading, 
    isPolling, 
    refresh, 
    clearData, 
    fetchEmailDetail, 
    getAttachmentUrl 
  } = useTempMail();
  
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailDetail, setEmailDetail] = useState<EmailDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const filteredEmails = emails.filter(email => 
    email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    email.from?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Email disalin!",
        description: "Alamat email berhasil disalin ke clipboard.",
      });
    }
  };

  const handleSelectEmail = async (id: string) => {
    setSelectedEmailId(id);
    setIsDetailLoading(true);
    try {
      const detail = await fetchEmailDetail(id);
      setEmailDetail(detail);
    } catch (e) {
      // Error handled in hook
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleClearData = () => {
    clearData();
    setSelectedEmailId(null);
    setEmailDetail(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <RefreshCw className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-slate-50 dark:bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full bg-white/80 dark:bg-card/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                TempMail Pro
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Live</span>
              </div>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Hapus Semua Data</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Hapus Semua Data</AlertDialogTitle>
                <AlertDialogDescription>
                  Apakah Anda yakin ingin menghapus semua riwayat email? Data tidak dapat dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearData} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl flex flex-col md:flex-row gap-6 h-[calc(100dvh-4rem)]">
        
        {/* Left Panel */}
        <div className="w-full md:w-[400px] lg:w-[450px] flex flex-col gap-4 h-full shrink-0">
          
          {/* Email Address Card */}
          <Card className="border-border shadow-sm bg-white dark:bg-card overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary/60 to-primary"></div>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-muted-foreground mb-1 uppercase tracking-wider">Alamat Email</h2>
              <div className="flex items-center gap-2 mt-2">
                <div className="relative flex-1">
                  <Input 
                    readOnly 
                    value={address} 
                    className="font-mono text-base md:text-lg bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 pr-12 focus-visible:ring-1 focus-visible:ring-primary/50 h-12"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={handleCopy}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Salin Email</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Email ini valid hingga <strong className="text-foreground">14 hari</strong> ke depan.</span>
              </p>
            </CardContent>
          </Card>

          {/* Inbox Container */}
          <Card className="flex-1 flex flex-col border-border shadow-sm bg-white dark:bg-card overflow-hidden min-h-[400px]">
            <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Inbox className="h-4 w-4 text-primary" />
                  Pesan Masuk
                  <Badge variant="secondary" className="ml-1 rounded-full px-2 py-0.5 text-xs font-normal">
                    {emails.length}
                  </Badge>
                </h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={refresh}
                  className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10"
                >
                  <RefreshCw className={`h-4 w-4 mr-1.5 ${isPolling ? 'animate-spin' : ''}`} />
                  Segarkan
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Cari email berdasarkan pengirim atau subjek..." 
                  className="pl-9 h-9 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus-visible:ring-1 focus-visible:ring-primary/50 text-sm"
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
                      <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                        <Mail className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {searchQuery ? 'Tidak ada email yang cocok dengan pencarian.' : 'Belum ada email masuk.'}
                      </p>
                      {!searchQuery && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          Menunggu pesan masuk...
                        </p>
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
                              ? 'bg-primary/5 border-primary/30 shadow-sm' 
                              : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <span className={`font-medium truncate text-sm ${selectedEmailId === email.id ? 'text-primary' : 'text-foreground'}`}>
                              {email.from}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 mt-0.5">
                              {new Date(email.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-foreground truncate mb-1">
                            {email.subject || '(Tanpa Subjek)'}
                          </p>
                          <p className="text-xs text-muted-foreground truncate opacity-80">
                            {email.subject ? `Pesan tentang: ${email.subject}` : 'Tidak ada pratinjau tersedia.'}
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
        <Card className="flex-1 flex flex-col border-border shadow-sm bg-white dark:bg-card overflow-hidden md:h-full min-h-[500px]">
          {selectedEmailId ? (
            isDetailLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center">
                <RefreshCw className="h-6 w-6 text-primary animate-spin mb-4" />
                <p className="text-sm text-muted-foreground">Memuat pesan...</p>
              </div>
            ) : emailDetail ? (
              <div className="flex flex-col h-full">
                {/* Email Header */}
                <div className="p-6 border-b border-border shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                      {emailDetail.subject || '(Tanpa Subjek)'}
                    </h2>
                    <Badge variant="outline" className="shrink-0 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 border-amber-200 dark:border-amber-500/20 px-3 py-1 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Valid hingga 14 Hari
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                        <span className="text-primary font-bold text-lg">
                          {emailDetail.from.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{emailDetail.from}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          Kepada: <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-foreground">{address}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground font-medium text-right">
                      {new Date(emailDetail.date).toLocaleString('id-ID', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <ScrollArea className="flex-1 bg-white dark:bg-[#121212]">
                  <div className="p-6 md:p-8">
                    {emailDetail.htmlBody ? (
                      <div 
                        className="prose prose-sm md:prose-base dark:prose-invert max-w-none 
                                   prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                                   prose-headings:font-semibold prose-img:rounded-md"
                        dangerouslySetInnerHTML={{ __html: emailDetail.htmlBody }} 
                      />
                    ) : (
                      <div className="whitespace-pre-wrap font-sans text-sm md:text-base text-foreground/90 leading-relaxed">
                        {emailDetail.textBody}
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Attachments Footer */}
                {emailDetail.attachments && emailDetail.attachments.length > 0 && (
                  <div className="p-4 border-t border-border bg-slate-50 dark:bg-slate-900/50 shrink-0">
                    <p className="text-sm font-semibold flex items-center gap-2 mb-3 text-foreground">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      Lampiran ({emailDetail.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {emailDetail.attachments.map((file, idx) => (
                        <a 
                          key={idx} 
                          href={getAttachmentUrl(emailDetail.id, file.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 bg-white dark:bg-card border border-border rounded-md px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group shadow-sm"
                        >
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center shrink-0">
                            <Download className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium max-w-[150px] truncate text-foreground">{file.filename}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">
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
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50/30 dark:bg-transparent">
              <div className="h-24 w-24 rounded-full bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                <Mail className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Pilih email untuk membaca detailnya.</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Email Anda bersifat sementara dan akan otomatis dihapus oleh sistem setelah waktu validasi berakhir.
              </p>
            </div>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center shrink-0 border-t border-border mt-auto bg-white/50 dark:bg-background/50">
        <p className="text-xs text-muted-foreground font-medium">
          Dibuat dengan menggunakan API 1secmail.com &bull; Data tersimpan di browser (LocalStorage)
        </p>
      </footer>
    </div>
  );
}
