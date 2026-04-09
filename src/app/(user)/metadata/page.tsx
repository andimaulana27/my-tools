// src/app/(user)/metadata/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Settings2, Play, AlertCircle, Loader2, Image as ImageIcon, CheckCircle2, Sparkles, Layers, Download, X } from "lucide-react";
import { processMetadataWithToken } from "../actions";

type ProcessedFile = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "success" | "error";
  metadata?: { title: string; keywords: string; description: string; category?: number };
  errorMessage?: string;
};

type AppMode = "adobe" | "canva";

export default function UnifiedMetadataGenerator() {
  const [mode, setMode] = useState<AppMode>("adobe");
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  const [config, setConfig] = useState({
    titleLengthMin: 20,
    titleLengthMax: 70,
    keywordsCount: 49,
    conceptContext: "",
    negativeKeywords: "logo, watermark, text",
    delay: 6000, 
  });

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const stopRef = useRef(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [artistName, setArtistName] = useState("");

  const isAdobe = mode === "adobe";
  const theme = {
    color: isAdobe ? "text-adobe-red" : "text-canva-cyan",
    bgGlow: isAdobe ? "bg-adobe-red/10" : "bg-canva-cyan/10",
    bgGradient: isAdobe ? "bg-gradient-to-r from-adobe-red to-adobe-pink" : "bg-gradient-to-r from-canva-cyan to-canva-purple",
    borderActive: isAdobe ? "focus:border-adobe-red/50 focus:ring-adobe-red/20" : "focus:border-canva-cyan/50 focus:ring-canva-cyan/20",
    borderColor: isAdobe ? "border-adobe-red/30" : "border-canva-cyan/30",
    shadow: isAdobe ? "shadow-[0_0_20px_rgba(255,0,0,0.2)]" : "shadow-[0_0_20px_rgba(0,196,204,0.2)]",
    title: isAdobe ? "Adobe Stock Engine" : "Canva Metadata Engine",
    desc: isAdobe 
      ? "Optimasi rasio konversi portofolio Adobe Stock Anda dengan judul dan kata kunci spesifik volume tinggi."
      : "Buat deskripsi elemen dan kata kunci relevan untuk mempercepat proses review Canva Creator.",
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    const isNewAdobe = newMode === "adobe";
    setConfig(prev => ({
      ...prev,
      keywordsCount: isNewAdobe ? 49 : 20,
      titleLengthMax: isNewAdobe ? 70 : 50,
      negativeKeywords: isNewAdobe ? "logo, watermark, text" : "logo, watermark, text, brand",
    }));
  };

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

  const addFiles = async (uploaded: File[]) => {
    const validFiles = uploaded.filter(file => file.type.startsWith('image/'));
    
    const newFiles: ProcessedFile[] = await Promise.all(validFiles.map(async (file) => {
      let processedFile = file;
      
      if (file.type === 'image/svg+xml') {
        try {
          processedFile = await new Promise<File>((resolve) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width > 0 ? img.width : 1024;
              canvas.height = img.height > 0 ? img.height : 1024;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                canvas.toBlob((blob) => {
                  if (blob) {
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".png";
                    resolve(new File([blob], newName, { type: 'image/png' }));
                  } else {
                    resolve(file); 
                  }
                  URL.revokeObjectURL(url);
                }, 'image/png', 1.0);
              } else {
                resolve(file);
              }
            };
            img.onerror = () => {
              URL.revokeObjectURL(url);
              resolve(file);
            };
            img.src = url;
          });
        } catch (error) {
          console.error("Gagal konversi SVG:", error);
        }
      }

      return {
        id: Math.random().toString(36).substring(7),
        file: processedFile,
        previewUrl: URL.createObjectURL(processedFile),
        status: "pending",
      };
    }));

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  const processBatch = async () => {
    if (files.length === 0 || !userId) return;
    
    const queue = files.filter(f => f.status === "pending" || f.status === "error");
    
    if (tokenBalance < queue.length) {
      setShowTokenAlert(true);
      return;
    }

    setIsProcessing(true);
    stopRef.current = false;
    
    let currentBalance = tokenBalance;

    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) break;
      const item = queue[i];

      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "processing", errorMessage: undefined } : f));

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("file", item.file);
      formData.append("mode", mode);
      formData.append("config", JSON.stringify(config));

      const result = await processMetadataWithToken(formData);

      if (result.success) {
        setFiles(prev => prev.map(f => f.id === item.id ? { 
          ...f, 
          status: "success", 
          metadata: result.metadata 
        } : f));
        
        currentBalance = result.newTokenBalance ?? currentBalance;
        setTokenBalance(currentBalance); 

        // MENGIRIM SINYAL UPDATE KE SIDEBAR (LAYOUT)
        window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
          detail: { newTokenBalance: currentBalance } 
        }));

      } else {
        if (result.error === "INSUFFICIENT_TOKENS") {
          setShowTokenAlert(true);
          setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "pending" } : f));
          break; 
        }
        setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "error", errorMessage: result.error } : f));
      }

      if (i < queue.length - 1 && !stopRef.current) {
        await new Promise(res => setTimeout(res, config.delay));
      }
    }
    
    setIsProcessing(false);
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    const successFiles = files.filter(f => f.status === "success");
    if (successFiles.length === 0) return;

    let csvContent = '';
    const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

    if (mode === "adobe") {
      const headers = ['Filename', 'Title', 'Keywords', 'Category', 'Releases'];
      const rows = successFiles.map(f => [
        escape(f.file.name),
        escape(f.metadata?.title || ''),
        escape(f.metadata?.keywords || ''),
        f.metadata?.category || 8, 
        '""'
      ]);
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (mode === "canva") {
      const headers = ['filename', 'title', 'keywords', 'Artist', 'locale', 'description'];
      const rows = successFiles.map(f => {
        const keywordsArray = (f.metadata?.keywords || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
        const limitedKeywords = keywordsArray.slice(0, 20).join(', ');
        
        return [
          escape(f.file.name),
          escape(f.metadata?.title || ''),
          escape(limitedKeywords),
          escape(artistName || ''), 
          '"en"',
          escape(f.metadata?.description || f.metadata?.title || '')
        ];
      });
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const firstFileName = successFiles[0].file.name.replace(/\.[^/.]+$/, "");
    const downloadName = successFiles.length === 1 
      ? `${firstFileName}_${mode}.csv`
      : `batch_metadata_${mode}.csv`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportModalOpen(false);
  };

  const totalCount = files.length;
  const doneCount = files.filter(f => f.status === "success" || f.status === "error").length;
  const successCount = files.filter(f => f.status === "success").length;
  const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-8 relative z-10"
    >
      {/* Mode Switcher Tabs */}
      <div className="flex bg-black/40 backdrop-blur-md border border-white/10 p-1.5 rounded-2xl w-fit shadow-inner">
        <button
          onClick={() => handleModeChange("adobe")}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            isAdobe ? "bg-gradient-to-r from-adobe-red to-adobe-pink text-white shadow-[0_0_15px_rgba(255,0,0,0.3)]" : "text-muted-foreground hover:text-white hover:bg-white/5"
          }`}
        >
          <Layers className="w-4 h-4" />
          Adobe Stock
        </button>
        <button
          onClick={() => handleModeChange("canva")}
          className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            !isAdobe ? "bg-gradient-to-r from-canva-cyan to-canva-purple text-white shadow-[0_0_15px_rgba(0,196,204,0.3)]" : "text-muted-foreground hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Canva
        </button>
      </div>

      {/* Dynamic Premium Header */}
      <div className="relative group overflow-hidden rounded-3xl">
        <div className={`absolute inset-0 bg-gradient-to-r ${isAdobe ? 'from-adobe-red/20' : 'from-canva-cyan/20'} to-transparent opacity-50`} />
        <div className={`absolute top-0 left-0 w-1 h-full ${theme.bgGradient}`} />
        
        <div className="relative bg-card/60 backdrop-blur-2xl border border-white/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-3 ${theme.bgGlow} ${theme.color} rounded-2xl border border-white/5 shadow-inner`}>
                <Sparkles className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">{theme.title}</h1>
            </div>
            <p className="text-muted-foreground text-base max-w-xl font-medium leading-relaxed">
              {theme.desc}
            </p>
          </div>
          <div className="flex flex-col md:items-end bg-black/40 border border-white/10 p-4 rounded-2xl shadow-inner backdrop-blur-md">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Status Kuota Aktif</span>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3.5 w-3.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tokenBalance > 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${tokenBalance > 0 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></span>
              </span>
              <span className="font-black text-xl text-white tracking-tight">{tokenBalance} <span className="text-sm font-semibold text-gray-400">Token</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Konfigurasi */}
        <div className="lg:col-span-4 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden group">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${theme.bgGlow} ${theme.color} shadow-inner`}>
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Generation Rules</h2>
            </div>
            <span className="text-[9px] font-bold bg-white/10 px-2.5 py-1.5 rounded-md text-gray-300 uppercase tracking-widest shadow-inner">
              Sequential
            </span>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Min Length</label>
                <input type="number" value={config.titleLengthMin} onChange={e => setConfig({...config, titleLengthMin: Number(e.target.value)})} className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:bg-black/60 focus:ring-1 transition-all shadow-inner ${theme.borderActive}`} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Max Length</label>
                <input type="number" value={config.titleLengthMax} onChange={e => setConfig({...config, titleLengthMax: Number(e.target.value)})} className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:bg-black/60 focus:ring-1 transition-all shadow-inner ${theme.borderActive}`} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Target Keywords</label>
              <input type="number" value={config.keywordsCount} onChange={e => setConfig({...config, keywordsCount: Number(e.target.value)})} className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:outline-none focus:bg-black/60 focus:ring-1 transition-all shadow-inner ${theme.borderActive}`} />
              {!isAdobe && <p className="text-[11px] text-gray-500 font-medium ml-1">Canva merekomendasikan max 20 keyword.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Konteks Desain (Opsional)</label>
              <textarea 
                value={config.conceptContext} 
                onChange={e => setConfig({...config, conceptContext: e.target.value})} 
                placeholder="Misal: vektor bentuk shape halftone, bukan style brush, dan khusus tanpa garis tepi (no offset path)..." 
                className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white h-28 resize-none focus:outline-none focus:bg-black/60 focus:ring-1 transition-all leading-relaxed shadow-inner ${theme.borderActive}`} 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Negative Terms</label>
              <textarea value={config.negativeKeywords} onChange={e => setConfig({...config, negativeKeywords: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-white h-20 resize-none focus:outline-none focus:bg-black/60 focus:ring-1 transition-all leading-relaxed shadow-inner ${theme.borderActive}`} />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Workspace & Hasil */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
            <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner">
                  <ImageIcon className="w-5 h-5 text-gray-300" />
                </div>
                Asset Workspace
              </h2>
              <div className="flex items-center gap-3">
                {successCount > 0 && (
                  <button 
                    onClick={() => setIsExportModalOpen(true)} 
                    disabled={isProcessing} 
                    className={`text-sm font-bold text-white px-5 py-2.5 rounded-xl transition-all ${theme.bgGradient} flex items-center gap-2 hover:scale-105 active:scale-95 ${theme.shadow}`}
                  >
                    <Download className="w-4 h-4" />
                    Export CSV ({successCount})
                  </button>
                )}
                {files.length > 0 && (
                  <button onClick={clearAll} disabled={isProcessing} className="text-sm font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors px-4 py-2.5 rounded-xl border border-transparent hover:border-white/10 shadow-sm">
                    Clear Board
                  </button>
                )}
              </div>
            </div>

            {/* Drag & Drop Area */}
            <label 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group ${
                isDragging ? `${theme.borderColor} ${theme.bgGlow} scale-[1.02]` : "border-white/20 bg-black/20 hover:bg-white/5 hover:border-white/30"
              }`}
            >
              <div className={`p-5 rounded-full mb-4 transition-all duration-300 ${isDragging ? `${theme.bgGradient} shadow-lg scale-110` : "bg-white/5 group-hover:bg-white/10 border border-white/10 shadow-inner"}`}>
                <UploadCloud className={`w-8 h-8 ${isDragging ? "text-white" : "text-gray-400 group-hover:text-white"}`} />
              </div>
              <p className="text-base text-white font-bold">Tarik & Lepaskan File Gambar</p>
              <p className="text-xs text-gray-500 mt-2 font-mono uppercase tracking-widest">Mendukung Format Standar & SVG</p>
              <input type="file" multiple accept="image/*" onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" />
            </label>

            {/* Action Button & Progress Bar Area */}
            {files.length > 0 && (
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <button 
                    onClick={processBatch} 
                    disabled={isProcessing || doneCount === totalCount}
                    className={`flex-1 relative overflow-hidden group/btn text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${theme.bgGradient} shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:scale-[1.01] active:scale-95`}
                  >
                    <div className="absolute inset-0 w-full h-full transform -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out" />
                    <span className="relative z-10 flex items-center gap-3">
                      {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                      {isProcessing ? "Neural Engine Bekerja..." : doneCount === totalCount ? "Proses Selesai" : `Mulai Generate Batch (${files.filter(f => f.status === 'pending' || f.status === 'error').length} Token)`}
                    </span>
                  </button>
                  {isProcessing && (
                    <button onClick={() => stopRef.current = true} className="px-8 py-4 bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-2xl font-bold hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30 transition-all active:scale-95 shadow-inner">
                      Hentikan
                    </button>
                  )}
                </div>

                {/* Progress Bar Visual */}
                {(isProcessing || doneCount > 0) && (
                  <div className="pt-6 border-t border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sync Progress</span>
                      <span className="text-sm font-black text-white">{doneCount} <span className="text-gray-500">/ {totalCount}</span></span>
                    </div>
                    <div className="w-full h-3 bg-black/40 border border-white/10 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full ${theme.bgGradient} transition-all duration-500 ease-out relative`} 
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List Hasil Gambar */}
          <div className="space-y-4">
            {files.map((file) => (
              <motion.div key={file.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col sm:flex-row gap-6 p-6 border border-white/10 rounded-3xl bg-card/60 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all hover:border-white/20 hover:bg-card/80 group">
                <div className="w-full sm:w-40 h-40 shrink-0 rounded-2xl overflow-hidden border border-white/10 bg-black/40 flex items-center justify-center relative shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1" />
                  {file.status === "processing" && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
                      <div className={`w-10 h-10 border-4 border-t-transparent rounded-full animate-spin`} style={{ borderLeftColor: isAdobe ? '#ef4444' : '#a855f7', borderRightColor: isAdobe ? '#ef4444' : '#a855f7', borderBottomColor: isAdobe ? '#ef4444' : '#a855f7' }}></div>
                    </div>
                  )}
                  {file.status === "success" && (
                    <div className="absolute top-3 right-3 bg-green-500 rounded-full p-2 shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {file.status === "pending" && <p className="text-gray-400 font-bold text-sm flex items-center gap-3"><span className="w-2.5 h-2.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(234,179,8,0.5)]"></span> Menunggu Antrean...</p>}
                  {file.status === "error" && <p className="text-red-400 font-bold text-sm flex items-center gap-2 bg-red-500/10 p-3 rounded-xl border border-red-500/20 w-fit"><AlertCircle className="w-4 h-4"/> {file.errorMessage}</p>}
                  
                  {file.status === "success" && file.metadata && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-black ${theme.color} uppercase tracking-widest`}>Optimized Title</span>
                          <span className="text-[10px] font-bold text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">{file.metadata.title.length} chars</span>
                        </div>
                        <p className="text-sm text-white font-bold bg-black/40 border border-white/10 px-4 py-3 rounded-xl truncate shadow-inner">{file.metadata.title}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-[10px] font-black ${theme.color} uppercase tracking-widest`}>SEO Keywords</span>
                          <span className="text-[10px] font-bold text-gray-500 bg-black/40 px-2 py-0.5 rounded border border-white/5">{file.metadata.keywords.split(',').length} tags</span>
                        </div>
                        <p className="text-xs text-gray-300 font-medium line-clamp-2 leading-relaxed bg-black/40 border border-white/10 px-4 py-3 rounded-xl shadow-inner">{file.metadata.keywords}</p>
                      </div>
                      {isAdobe && file.metadata.category && (
                        <div>
                          <span className={`text-[10px] font-black ${theme.color} uppercase tracking-widest block mb-1.5`}>AI Category Suggestion</span>
                          <span className="text-xs font-bold bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white shadow-inner flex w-fit items-center gap-2">
                            <Layers className="w-3 h-3" /> Category ID: {file.metadata.category}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Export CSV */}
      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-card/80 backdrop-blur-2xl border border-white/10 w-full max-w-sm rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                <h3 className="text-xl font-black text-white flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${theme.bgGradient} shadow-inner`}>
                    <Download className="w-4 h-4 text-white" />
                  </div>
                  Export Data
                </h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-gray-400 hover:text-white bg-black/40 hover:bg-white/10 p-2 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleExport} className="p-6 space-y-6">
                <div className="bg-black/40 border border-white/10 p-6 rounded-2xl text-center shadow-inner">
                  <span className={`text-5xl font-black text-transparent bg-clip-text ${theme.bgGradient}`}>{successCount}</span>
                  <p className="text-sm font-bold text-gray-400 mt-2">File siap diunduh untuk <br/> <span className="text-white">{mode === "canva" ? "Canva Creator" : "Adobe Stock"}</span></p>
                </div>

                {mode === "canva" && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nama Artist (Brand Canva)</label>
                    <input
                      type="text"
                      required
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-3.5 px-4 text-white font-bold focus:outline-none focus:border-canva-cyan/50 focus:ring-1 focus:ring-canva-cyan/20 transition-all shadow-inner"
                      placeholder="Masukkan nama artist..."
                    />
                    <p className="text-[10px] text-gray-500 font-medium ml-1">Maksimal 20 keyword CSV sesuai aturan Canva.</p>
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full ${theme.bgGradient} text-white font-black text-lg rounded-xl py-4 mt-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg ${theme.shadow}`}
                >
                  Download .CSV
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Peringatan Token Habis */}
      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-card/80 backdrop-blur-2xl border border-red-500/30 w-full max-w-md rounded-[2rem] shadow-[0_20px_60px_rgba(239,68,68,0.2)] p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 to-red-400"></div>
              <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-inner">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Token Tidak Cukup</h3>
              <p className="text-gray-400 text-base mb-8 leading-relaxed font-medium">
                Sisa token di akun Anda saat ini hanya <span className="text-red-400 font-bold">{tokenBalance} Token</span>. Jumlah ini lebih sedikit dari antrean gambar yang ingin diproses. Hubungi Admin untuk Top-Up kuota.
              </p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-black text-lg py-4 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}