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
      <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-fit shadow-inner overflow-x-auto custom-scrollbar">
        <button onClick={() => setMode("convert")} className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "convert" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
          <RefreshCw className="w-4 h-4" /> Konverter
        </button>
        <button onClick={() => setMode("compress")} className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "compress" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
          <Minimize2 className="w-4 h-4" /> Smart Compressor
        </button>
        <button onClick={() => setMode("upscale")} className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "upscale" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
          <Maximize2 className="w-4 h-4" /> GPU Upscaler
        </button>
        <button onClick={() => setMode("remove-bg")} className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-2 whitespace-nowrap ${mode === "remove-bg" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"}`}>
          <Eraser className="w-4 h-4" /> AI BG Remover
        </button>
      </div>

      {/* HEADER PANEL */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className={`p-2 rounded-lg border ${
                mode === 'convert' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                mode === 'upscale' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                mode === 'compress' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' :
                'bg-violet-500/10 border-violet-500/20 text-violet-400'
              }`}>
              {mode === 'remove-bg' ? <Eraser className="w-5 h-5" /> : mode === 'compress' ? <Minimize2 className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {mode === 'convert' ? 'Pro Image Converter' : 
               mode === 'upscale' ? 'AI GPU Upscaler' : 
               mode === 'compress' ? 'Smart Image Compressor' :
               'AI Background Remover'}
            </h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
            {mode === 'convert' 
              ? 'Konversi massal ke berbagai format eksklusif dengan penanganan transparansi instan, tanpa menyisakan sampah di server Anda.' 
              : mode === 'upscale'
              ? 'Perbesar resolusi gambar hingga 4x murni menggunakan kekuatan VRAM dari kartu grafis GPU (Real-ESRGAN).'
              : mode === 'compress'
              ? 'Perkecil ukuran file (MB) secara drastis dengan mempertahankan kualitas visual. Berjalan 100% di browser Anda (Client-Side) sehingga cepat dan unlimited.'
              : 'Hapus latar belakang dari gambar secara instan. Menggunakan komputasi WebAssembly Client-Side sehingga proses lebih cepat dan anti-timeout.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: KONFIGURASI */}
        <div className="lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <Settings2 className="w-4 h-4 text-zinc-400" />
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Engine Rules</h2>
          </div>

          {mode === "convert" ? (
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Output Format</label>
              <div className="flex flex-wrap gap-2">
                {[".png", ".jpg", ".webp", ".avif", ".tiff", ".gif", ".ico"].map((ext) => (
                  <button 
                    key={ext} 
                    onClick={() => setConfig({...config, targetFormat: ext})} 
                    className={`flex-grow px-3 py-2 rounded-lg text-xs font-bold border transition-all ${config.targetFormat === ext ? 'bg-zinc-100 text-black border-zinc-200' : 'bg-black/20 text-zinc-500 border-white/5 hover:border-white/10'}`}
                  >
                    {ext.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          ) : mode === "upscale" ? (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">AI Model Style</label>
                <div className="flex flex-col gap-2">
                  {[
                    { id: "realesrgan-x4plus", label: "Photo / Realistic" },
                    { id: "realesrgan-x4plus-anime", label: "Vector / Anime" }
                  ].map((m) => (
                    <button 
                      key={m.id} 
                      onClick={() => setConfig({...config, upscaleModel: m.id})} 
                      className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all text-left ${config.upscaleModel === m.id ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-black/20 text-zinc-500 border-white/5 hover:border-white/10'}`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Upscale Factor</label>
                <div className="grid grid-cols-3 gap-2">
                  {["2", "3", "4"].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setConfig({...config, upscaleScale: s})} 
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${config.upscaleScale === s ? 'bg-zinc-100 text-black border-zinc-200' : 'bg-black/20 text-zinc-500 border-white/5 hover:border-white/10'}`}
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
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Target Maximum Size (MB)</label>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 5].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setConfig({...config, compressMaxSizeMB: s})} 
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${config.compressMaxSizeMB === s ? 'bg-sky-500 text-white border-sky-400' : 'bg-black/20 text-zinc-500 border-white/5 hover:border-white/10'}`}
                    >
                      {s} MB
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Sistem akan berusaha mengecilkan ukuran file hingga di bawah batas ini.</p>
              </div>
              <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Max Resolution (Px)</label>
                <div className="grid grid-cols-2 gap-2">
                  {[1080, 1920, 2560, 3840].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setConfig({...config, compressMaxWidthOrHeight: s})} 
                      className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${config.compressMaxWidthOrHeight === s ? 'bg-zinc-100 text-black border-zinc-200' : 'bg-black/20 text-zinc-500 border-white/5 hover:border-white/10'}`}
                    >
                      {s}p
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
               <p className="text-xs text-zinc-400 leading-relaxed border border-violet-500/20 bg-violet-500/5 p-4 rounded-xl">
                 <strong>Client-Side Engine:</strong> Mode ini otomatis memotong objek dari latar belakang. Karena proses berjalan di perangkat Anda (browser), kecepatan bergantung pada koneksi internet (download model cache), dan CPU/RAM komputer Anda.
               </p>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: WORKSPACE */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <label className="flex flex-col items-center justify-center w-full h-48 border border-dashed border-white/10 bg-black/20 rounded-xl cursor-pointer hover:bg-white/[0.02] hover:border-white/20 transition-all group">
              <UploadCloud className="w-8 h-8 text-zinc-500 group-hover:text-zinc-300 mb-3" />
              <p className="text-sm text-zinc-200 font-bold">Upload Source Assets</p>
              <p className="text-[10px] text-zinc-500 mt-1.5 uppercase tracking-widest font-mono">Supports Standard Image Formats</p>
              <input type="file" multiple accept="image/*" onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="mt-6 flex gap-3">
                <button 
                  onClick={handleProcess} 
                  disabled={isProcessing} 
                  className="flex-1 bg-zinc-100 text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                  {isProcessing ? "Executing Tasks..." : `Start Processing (${files.length} Assets)`}
                </button>
                {isProcessing && (
                  <button onClick={() => stopRef.current = true} className="px-6 py-3 bg-black/40 border border-white/5 text-zinc-300 rounded-xl font-bold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all text-sm">
                    Stop
                  </button>
                )}
                <button 
                  onClick={handleClear} 
                  disabled={isProcessing} 
                  className="px-6 py-3 bg-white/5 border border-white/5 text-zinc-400 rounded-xl font-bold hover:text-white transition-all text-sm"
                >
                  Clear Board
                </button>
              </div>
            )}
          </div>

          {/* LIST ITEMS (WORKSPACE) */}
          <div className="grid grid-cols-1 gap-3">
            {files.map((file) => (
              <div key={file.id} className={`flex items-center gap-4 p-4 border rounded-2xl group transition-colors ${file.status === "success" && mode === 'remove-bg' ? 'border-violet-500/20 bg-violet-500/5' : file.status === "success" && mode === 'compress' ? 'border-sky-500/20 bg-sky-500/5' : 'border-white/5 bg-white/[0.01]'}`}>
                
                {/* Visual Preview */}
                <div className={`w-16 h-16 rounded-lg overflow-hidden border border-white/5 shrink-0 relative ${file.status === 'success' && mode === 'remove-bg' ? 'bg-[url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' viewBox=\'0 0 16 16\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h8v8H0zm8 8h8v8H8z\' fill=\'%23ffffff\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]' : 'bg-black/40'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.status === 'success' && file.resultUrl ? file.resultUrl : file.previewUrl} alt="preview" className="w-full h-full object-contain" />
                  {file.status === "processing" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-300" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <p className="text-sm font-bold text-zinc-200 truncate">{file.file.name}</p>
                  
                  {/* Size Info (Khusus Compressor) */}
                  {file.originalSize && (
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      {formatBytes(file.originalSize)} {file.finalSize ? <span className="text-emerald-400 font-bold ml-1">→ {formatBytes(file.finalSize)}</span> : ''}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    {file.status === "pending" && <span className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold uppercase"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Queued</span>}
                    {file.status === "processing" && <span className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase"><Loader2 className="w-3 h-3 animate-spin"/> Processing...</span>}
                    {file.status === "success" && <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${mode === 'remove-bg' ? 'text-violet-400 bg-violet-500/10 border-violet-500/20' : mode === 'compress' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}><CheckCircle2 className="w-3 h-3"/> Done</span>}
                    {file.status === "error" && <span className="flex items-center gap-1.5 text-[10px] text-rose-400 font-bold uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20"><AlertCircle className="w-3 h-3"/> {file.errorMessage || 'Failed'}</span>}
                  </div>
                </div>

                {file.status === "success" && file.resultUrl && (
                  <a 
                    href={file.resultUrl} 
                    download={`${file.file.name.replace(/\.[^/.]+$/, "")}_${mode === 'upscale' ? 'GPU_Upscaled' : mode === 'remove-bg' ? 'Nobg' : mode === 'compress' ? 'Compressed' : 'Converted'}.${file.resultFormat}`} 
                    className="p-3 bg-zinc-100 hover:bg-white text-black font-bold border border-white/5 rounded-xl transition-all active:scale-95 shadow-sm flex items-center gap-2"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Insufficient Quota</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Sisa token Anda (<strong className="text-rose-400">{tokenBalance} Tokens</strong>) tidak mencukupi untuk memproses sisa antrean ini.</p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-white/5 border border-white/10 text-white font-bold text-sm py-3 rounded-lg hover:bg-white/10 transition-colors active:scale-95">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}