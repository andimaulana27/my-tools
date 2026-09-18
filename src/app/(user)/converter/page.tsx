// src/app/(user)/converter/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  RefreshCw, 
  Zap, 
  UploadCloud, 
  Settings2, 
  Play, 
  Loader2, 
  AlertCircle, 
  Download, 
  CheckCircle2,
  Maximize2,
  Eraser,
  Minimize2 // <--- Icon Baru untuk Compressor
} from "lucide-react";

import { processImageConverter, processGPUUpscale, processRemoveBackground, processCompressImage } from "../actions/converter";
import { PageHeading } from "@/components/ui/PageHeading";
import { removeBackground } from "@imgly/background-removal";
import imageCompression from "browser-image-compression"; // <--- Library Baru

// Tambahkan "compress" ke dalam tipe AppMode
type AppMode = "convert" | "upscale" | "remove-bg" | "compress";

type ProcessedFile = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "success" | "error";
  resultUrl?: string;
  resultFormat?: string; 
  errorMessage?: string;
  originalSize?: number; // Untuk menampilkan ukuran awal
  finalSize?: number;    // Untuk menampilkan ukuran akhir
};

type ActionResponse = {
  success: boolean;
  url?: string;
  format?: string;
  newTokenBalance?: number;
  error?: string;
};

// Fungsi helper mengubah byte ke MB
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function ProConverterPage() {
  const [mode, setMode] = useState<AppMode>("convert");
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  const [config, setConfig] = useState({
    targetFormat: ".png", 
    upscaleScale: "4",    
    upscaleModel: "realesrgan-x4plus",
    // Config baru untuk Compressor
    compressMaxSizeMB: 2, 
    compressMaxWidthOrHeight: 1920,
  });

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const stopRef = useRef(false);

  useEffect(() => {
    async function fetchUser() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setUserId(authData.user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("token_balance")
          .eq("id", authData.user.id)
          .single();
        if (profile) setTokenBalance(profile.token_balance);
      }
    }
    fetchUser();
  }, []);

  const addFiles = (uploaded: File[]) => {
    const newFiles = uploaded.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending" as const,
      originalSize: file.size
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleProcess = async () => {
    if (files.length === 0 || !userId) return;
    
    const queue = files.filter(f => f.status === "pending" || f.status === "error");
    if (tokenBalance < queue.length) {
      setShowTokenAlert(true);
      return;
    }

    setIsProcessing(true);
    stopRef.current = false;
    let currentBalance = tokenBalance;

    for (const item of queue) {
      if (stopRef.current) break;

      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "processing", errorMessage: undefined } : f));

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("file", item.file);
      formData.append("mode", mode);
      formData.append("config", JSON.stringify(config));

      try {
        if (mode === "remove-bg") {
          // PROSES HAPUS BG (Client Side)
          const tokenResult = await processRemoveBackground(formData);
          if (tokenResult.success) {
            const imageBlob = await removeBackground(item.file);
            const safeDownloadUrl = URL.createObjectURL(imageBlob);

            setFiles(prev => prev.map(f => f.id === item.id ? { 
              ...f, status: "success", resultUrl: safeDownloadUrl, resultFormat: "png", finalSize: imageBlob.size 
            } : f));
            
            currentBalance = tokenResult.newTokenBalance ?? currentBalance;
            setTokenBalance(currentBalance);
            window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { detail: { newTokenBalance: currentBalance } }));
          } else {
            throw new Error(tokenResult.error || "Gagal memotong token");
          }

        } else if (mode === "compress") {
          // PROSES KOMPRESI SMART (Client Side)
          const tokenResult = await processCompressImage(formData);
          if (tokenResult.success) {
            
            // Konfigurasi Library Compressor
            const options = {
              maxSizeMB: config.compressMaxSizeMB,
              maxWidthOrHeight: config.compressMaxWidthOrHeight,
              useWebWorker: true, // Biar UI gak ngelag
            };

            const compressedFile = await imageCompression(item.file, options);
            const safeDownloadUrl = URL.createObjectURL(compressedFile);
            
            // Ambil ekstensi aslinya
            const ext = item.file.name.split('.').pop()?.toLowerCase() || "jpg";

            setFiles(prev => prev.map(f => f.id === item.id ? { 
              ...f, status: "success", resultUrl: safeDownloadUrl, resultFormat: ext, finalSize: compressedFile.size 
            } : f));
            
            currentBalance = tokenResult.newTokenBalance ?? currentBalance;
            setTokenBalance(currentBalance);
            window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { detail: { newTokenBalance: currentBalance } }));
          } else {
            throw new Error(tokenResult.error || "Gagal memotong token");
          }

        } else {
          // PROSES SERVER (Convert & Upscale)
          let result: ActionResponse | undefined;

          if (mode === "convert") {
            result = await processImageConverter(formData);
          } else if (mode === "upscale") {
            result = await processGPUUpscale(formData);
          }

          if (result && result.success && result.url) {
            const res = await fetch(result.url);
            const blob = await res.blob();
            const safeDownloadUrl = URL.createObjectURL(blob);

            setFiles(prev => prev.map(f => f.id === item.id ? { 
              ...f, status: "success", resultUrl: safeDownloadUrl, resultFormat: result!.format, finalSize: blob.size 
            } : f));
            
            currentBalance = result.newTokenBalance ?? currentBalance;
            setTokenBalance(currentBalance);
            window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { detail: { newTokenBalance: currentBalance } }));
          } else {
            throw new Error(result?.error || "Gagal diproses");
          }
        }
      } catch (err: unknown) {
        setFiles(prev => prev.map(f => f.id === item.id ? { 
          ...f, status: "error", errorMessage: err instanceof Error ? err.message : "Terjadi kesalahan sistem" 
        } : f));
      }
    }
    setIsProcessing(false);
  };

  const handleClear = () => {
    files.forEach(f => {
      URL.revokeObjectURL(f.previewUrl);
      if (f.resultUrl) URL.revokeObjectURL(f.resultUrl);
    });
    setFiles([]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
      
      {/* TABS SELECTOR */}
      <div className="flex w-fit overflow-x-auto border border-line">
        <button onClick={() => setMode("convert")} className={`px-6 py-2 text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "convert" ? "bg-btn-bg text-btn-fg " : "text-text-muted transition-colors duration-hover hover:bg-wash hover:text-text"}`}>
          <RefreshCw className="w-4 h-4" /> Konverter
        </button>
        <button onClick={() => setMode("compress")} className={`px-6 py-2 text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "compress" ? "bg-btn-bg text-btn-fg " : "text-text-muted transition-colors duration-hover hover:bg-wash hover:text-text"}`}>
          <Minimize2 className="w-4 h-4" /> Smart Compressor
        </button>
        <button onClick={() => setMode("upscale")} className={`px-6 py-2 text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "upscale" ? "bg-btn-bg text-btn-fg " : "text-text-muted transition-colors duration-hover hover:bg-wash hover:text-text"}`}>
          <Maximize2 className="w-4 h-4" /> GPU Upscaler
        </button>
        <button onClick={() => setMode("remove-bg")} className={`px-6 py-2 text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "remove-bg" ? "bg-btn-bg text-btn-fg " : "text-text-muted transition-colors duration-hover hover:bg-wash hover:text-text"}`}>
          <Eraser className="w-4 h-4" /> AI BG Remover
        </button>
      </div>

      {/* HEADER PANEL */}
      <PageHeading
        stamp="Utility"
        title={
          mode === "convert"
            ? "Converter."
            : mode === "upscale"
              ? "Upscaler."
              : mode === "compress"
                ? "Compressor."
                : "Remover."
        }
        lede={
          mode === "convert"
            ? "Konversi massal ke berbagai format dengan transparansi, tanpa sampah di server."
            : mode === "upscale"
              ? "Perbesar resolusi hingga 4x dengan Real-ESRGAN di GPU."
              : mode === "compress"
                ? "Perkecil ukuran file di browser, tanpa antri server."
                : "Hapus latar belakang secara instan di perangkat Anda."
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: KONFIGURASI */}
        <div className="lg:col-span-4 bg-bg border border-line p-6 space-y-6">
          <div className="flex items-center gap-2.5 border-b border-line pb-4">
            <Settings2 className="w-4 h-4 text-text-muted" />
            <h2 className="text-sm font-bold text-text uppercase tracking-widest">Engine Rules</h2>
          </div>

          {mode === "convert" ? (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Output Format</label>
              <div className="flex flex-wrap gap-2">
                {[".png", ".jpg", ".webp", ".avif", ".tiff", ".gif", ".ico"].map((ext) => (
                  <button 
                    key={ext} 
                    onClick={() => setConfig({...config, targetFormat: ext})} 
                    className={`flex-grow px-3 py-2 text-xs font-bold border transition-all ${config.targetFormat === ext ? 'bg-btn-bg text-btn-fg border-text' : 'bg-wash text-text-muted border-line hover:border-text'}`}
                  >
                    {ext.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ) : mode === "upscale" ? (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">AI Model Style</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "realesrgan-x4plus", label: "Photo / Realistic" },
                    { id: "realesrgan-x4plus-anime", label: "Vector / Anime" }
                  ].map((m) => (
                    <button 
                      key={m.id} 
                      onClick={() => setConfig({...config, upscaleModel: m.id})} 
                      className={`px-4 py-3 text-xs font-bold border transition-all text-left ${config.upscaleModel === m.id ? 'bg-wash text-accent border-line' : 'bg-wash text-text-muted border-line hover:border-text'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-line">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Upscale Factor</label>
                <div className="grid grid-cols-3 gap-2">
                  {["2", "3", "4"].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setConfig({...config, upscaleScale: s})} 
                      className={`px-3 py-2 text-xs font-bold border transition-all ${config.upscaleScale === s ? 'bg-btn-bg text-btn-fg border-text' : 'bg-wash text-text-muted border-line hover:border-text'}`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : mode === "compress" ? (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Target Maximum Size (MB)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 5].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setConfig({...config, compressMaxSizeMB: s})} 
                      className={`px-3 py-2 text-xs font-bold border transition-all ${config.compressMaxSizeMB === s ? 'bg-btn-bg text-btn-fg border-text' : 'bg-wash text-text-muted border-line hover:border-text'}`}
                    >
                      {s} MB
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-text-muted leading-relaxed">Sistem akan berusaha mengecilkan ukuran file hingga di bawah batas ini.</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-line">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest block">Max Resolution (Px)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[1080, 1920, 2560, 3840].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setConfig({...config, compressMaxWidthOrHeight: s})} 
                      className={`px-3 py-2 text-xs font-bold border transition-all ${config.compressMaxWidthOrHeight === s ? 'bg-btn-bg text-btn-fg border-text' : 'bg-wash text-text-muted border-line hover:border-text'}`}
                    >
                      {s}p
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
               <p className="text-xs text-text-muted leading-relaxed border border-line bg-wash p-4">
                 <strong>Client-Side Engine:</strong> Mode ini otomatis memotong objek dari latar belakang. Karena proses berjalan di perangkat Anda (browser), kecepatan bergantung pada koneksi internet (download model cache), dan CPU/RAM komputer Anda.
               </p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: WORKSPACE */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-bg border border-line p-6">
            <label className="flex flex-col items-center justify-center w-full h-48 border border-dashed border-line bg-wash cursor-pointer hover:bg-wash hover:border-text transition-all group">
              <UploadCloud className="w-8 h-8 text-text-muted group-hover:text-text mb-3" />
              <p className="text-sm text-text font-bold">Upload Source Assets</p>
              <p className="text-[10px] text-text-muted mt-1.5 uppercase tracking-widest font-mono">Supports Standard Image Formats</p>
              <input type="file" multiple accept="image/*" onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={handleProcess} 
                  disabled={isProcessing} 
                  className="btn-primary flex-1"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  {isProcessing ? "Executing Tasks..." : `Start Processing (${files.length} Assets)`}
                </button>
                {isProcessing && (
                  <button onClick={() => stopRef.current = true} className="btn-ghost">
                    Stop
                  </button>
                )}
                <button 
                  onClick={handleClear} 
                  disabled={isProcessing} 
                  className="btn-ghost"
                >
                  Clear Board
                </button>
              </div>
            )}
          </div>

          {/* LIST ITEMS (WORKSPACE) */}
          <div className="grid grid-cols-1 gap-3">
            {files.map((file) => (
              <div key={file.id} className={`flex items-center gap-4 p-4 border group transition-colors ${file.status === "success" && mode === 'remove-bg' ? 'border-line bg-wash' : file.status === "success" && mode === 'compress' ? 'border-line bg-wash' : 'border-line bg-bg'}`}>
                
                {/* Visual Preview */}
                <div className={`w-16 h-16 overflow-hidden border border-line shrink-0 relative ${file.status === 'success' && mode === 'remove-bg' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h8v8H0zm8 8h8v8H8z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' : 'bg-bg-elevated'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.status === 'success' && file.resultUrl ? file.resultUrl : file.previewUrl} alt="preview" className="w-full h-full object-contain" />
                  {file.status === "processing" && (
                    <div className="absolute inset-0 bg-bg/80 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 animate-spin text-text" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-bold text-text truncate">{file.file.name}</p>
                  
                  {/* Size Info (Khusus Compressor) */}
                  {file.originalSize && (
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {formatBytes(file.originalSize)} {file.finalSize ? <span className="text-accent font-bold ml-1">→ {formatBytes(file.finalSize)}</span> : ''}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {file.status === "pending" && <span className="flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase"><span className="w-1.5 h-1.5 bg-btn-bg animate-pulse"></span> Queued</span>}
                    {file.status === "processing" && <span className="flex items-center gap-1.5 text-[10px] text-text-muted font-bold uppercase"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</span>}
                    {file.status === "success" && <span className="flex items-center gap-1.5 border border-line bg-wash px-2 py-0.5 text-[10px] font-medium uppercase text-accent"><CheckCircle2 className="w-3 h-3"/> Done</span>}
                    {file.status === "error" && <span className="flex items-center gap-1.5 text-[10px] text-accent font-bold uppercase bg-wash px-2 py-0.5 border border-line"><AlertCircle className="w-3 h-3"/> {file.errorMessage || 'Failed'}</span>}
                  </div>
                </div>

                {file.status === "success" && file.resultUrl && (
                  <a 
                    href={file.resultUrl} 
                    download={`${file.file.name.replace(/\.[^/.]+$/, "")}_${mode === 'upscale' ? 'GPU_Upscaled' : mode === 'remove-bg' ? 'Nobg' : mode === 'compress' ? 'Compressed' : 'Converted'}.${file.resultFormat}`} 
                    className="btn-primary h-11 shrink-0 px-4"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-xs hidden sm:block uppercase tracking-widest">{file.resultFormat}</span>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALERT TOKEN */}
      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-bg border border-line w-full max-w-sm p-8 text-center">
              <div className="w-12 h-12 bg-wash border border-line flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Insufficient Quota</h3>
              <p className="text-text-muted text-sm mb-6 leading-relaxed">Sisa token Anda (<strong className="text-accent">{tokenBalance} Tokens</strong>) tidak mencukupi untuk memproses sisa antrean ini.</p>
              <button onClick={() => setShowTokenAlert(false)} className="btn-ghost w-full">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}