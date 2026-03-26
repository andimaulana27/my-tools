// src/app/(user)/canva/page.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Settings2, Play, AlertCircle, Loader2, Image as ImageIcon, CheckCircle2, Sparkles } from "lucide-react";
import { processMetadataWithToken } from "../actions";

// Tipe Data
type ProcessedFile = {
  id: string;
  file: File;
  previewUrl: string;
  status: "pending" | "processing" | "success" | "error";
  metadata?: { title: string; keywords: string; description: string; category?: number };
  errorMessage?: string;
};

export default function CanvaGenerator() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  // Konfigurasi Engine (Bisa disesuaikan khusus Canva jika perlu)
  const [config, setConfig] = useState({
    titleLengthMin: 15,
    titleLengthMax: 50,
    keywordsCount: 20, // Canva biasanya butuh lebih sedikit keyword tapi spesifik
    conceptContext: "",
    negativeKeywords: "logo, watermark, text, brand",
    delay: 2000,
  });

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const stopRef = useRef(false);

  // Ambil Data User Saat Load
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

  // --- Handlers Upload ---
  const addFiles = (uploaded: File[]) => {
    const validFiles = uploaded.filter(file => file.type.startsWith('image/'));
    const newFiles: ProcessedFile[] = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: "pending",
    }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  };

  // --- Proses Utama Generator ---
  const processBatch = async () => {
    if (files.length === 0 || !userId) return;
    
    const pendingCount = files.filter(f => f.status === "pending" || f.status === "error").length;
    if (tokenBalance < pendingCount) {
      setShowTokenAlert(true);
      return;
    }

    setIsProcessing(true);
    stopRef.current = false;
    
    let currentBalance = tokenBalance;
    const queue = [...files];

    for (let i = 0; i < queue.length; i++) {
      if (stopRef.current) break;
      const item = queue[i];
      if (item.status === "success") continue;

      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: "processing" } : f));

      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("file", item.file);
      formData.append("mode", "canva"); // Mode spesifik untuk Canva
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header Premium Khas Canva (Aksen Ungu) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-purple-600/10 via-background to-background border-l-4 border-l-purple-600 border-y border-r border-card-border p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-600 text-white rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Canva Metadata Engine</h1>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl">
            Buat deskripsi elemen dan kata kunci relevan untuk mempercepat proses persetujuan dan pencarian elemen di Canva Creator.
          </p>
        </div>
        <div className="flex flex-col md:items-end">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Status Kuota</span>
          <div className="flex items-center gap-2 bg-background border border-card-border px-4 py-2 rounded-xl">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${tokenBalance > 0 ? 'bg-green-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${tokenBalance > 0 ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </span>
            <span className="font-bold text-foreground">{tokenBalance} Token</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Kolom Kiri: Konfigurasi */}
        <div className="lg:col-span-4 bg-card border border-card-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-2 border-b border-card-border pb-4">
            <Settings2 className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-foreground">Generation Rules</h2>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Min Length</label>
                <input type="number" value={config.titleLengthMin} onChange={e => setConfig({...config, titleLengthMin: Number(e.target.value)})} className="w-full bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none transition-colors" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Max Length</label>
                <input type="number" value={config.titleLengthMax} onChange={e => setConfig({...config, titleLengthMax: Number(e.target.value)})} className="w-full bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Target Keywords</label>
              <input type="number" value={config.keywordsCount} onChange={e => setConfig({...config, keywordsCount: Number(e.target.value)})} className="w-full bg-background border border-card-border rounded-lg px-3 py-2.5 text-sm font-medium focus:border-purple-500 focus:outline-none transition-colors" />
              <p className="text-[10px] text-muted-foreground mt-1">Saran: Canva merekomendasikan 20 keyword relevan.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Konteks Desain (Opsional)</label>
              <textarea value={config.conceptContext} onChange={e => setConfig({...config, conceptContext: e.target.value})} placeholder="Sebutkan gaya: cute, watercolor, flat minimalis..." className="w-full bg-background border border-card-border rounded-lg px-3 py-3 text-sm h-24 resize-none focus:border-purple-500 focus:outline-none transition-colors leading-relaxed" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Negative Terms</label>
              <textarea value={config.negativeKeywords} onChange={e => setConfig({...config, negativeKeywords: e.target.value})} className="w-full bg-background border border-card-border rounded-lg px-3 py-3 text-sm h-20 resize-none focus:border-purple-500 focus:outline-none transition-colors leading-relaxed" />
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Workspace & Hasil */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-muted-foreground" />
                Asset Workspace
              </h2>
              {files.length > 0 && (
                <button onClick={clearAll} disabled={isProcessing} className="text-xs font-medium text-purple-500 hover:text-purple-400 transition-colors bg-purple-500/10 px-3 py-1.5 rounded-lg">
                  Clear Board
                </button>
              )}
            </div>

            {/* Drag & Drop Area */}
            <label 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200 ${
                isDragging ? "border-purple-500 bg-purple-500/5 scale-[1.01]" : "border-card-border hover:border-purple-500/30 hover:bg-accent/30"
              }`}
            >
              <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? "bg-purple-500/20" : "bg-accent"}`}>
                <UploadCloud className={`w-8 h-8 ${isDragging ? "text-purple-500" : "text-muted-foreground"}`} />
              </div>
              <p className="text-sm text-foreground font-semibold">Tarik & Lepaskan File Vektor/Raster</p>
              <p className="text-xs text-muted-foreground mt-1 font-mono uppercase">Mendukung Format Gambar Standar</p>
              <input type="file" multiple accept="image/*" onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" />
            </label>

            {/* Action Button */}
            {files.length > 0 && (
              <div className="flex gap-4 mt-6">
                <button 
                  onClick={processBatch} 
                  disabled={isProcessing}
                  className="flex-1 bg-purple-600 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-600/20"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  {isProcessing ? "Neural Engine Bekerja..." : `Mulai Generate (${files.length} Token)`}
                </button>
                {isProcessing && (
                  <button onClick={() => stopRef.current = true} className="px-6 py-3.5 bg-background border border-card-border text-foreground rounded-xl font-bold hover:bg-accent transition-colors">
                    Hentikan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* List Hasil Gambar */}
          <div className="space-y-4">
            {files.map((file) => (
              <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-5 p-5 border border-card-border rounded-2xl bg-card shadow-sm hover:border-purple-500/20 transition-colors">
                <div className="w-full sm:w-36 h-36 shrink-0 rounded-xl overflow-hidden border border-card-border bg-accent flex items-center justify-center relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  {file.status === "processing" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                    </div>
                  )}
                  {file.status === "success" && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {file.status === "pending" && <p className="text-muted-foreground text-sm flex items-center gap-2"><span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span> Antrean Generate...</p>}
                  {file.status === "error" && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> {file.errorMessage}</p>}
                  
                  {file.status === "success" && file.metadata && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Element Title</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{file.metadata.title.length} chars</span>
                        </div>
                        <p className="text-sm text-foreground font-medium bg-background border border-card-border p-2.5 rounded-lg truncate">{file.metadata.title}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Search Keywords</span>
                          <span className="text-[10px] font-mono text-muted-foreground">{file.metadata.keywords.split(',').length} tags</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-background border border-card-border p-2.5 rounded-lg">{file.metadata.keywords}</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Peringatan Token Habis */}
      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-red-500/20 w-full max-w-md rounded-3xl shadow-2xl p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Token Tidak Cukup</h3>
              <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
                Sisa token di akun Anda saat ini <b>({tokenBalance} Token)</b>. Jumlah ini lebih sedikit dari antrean gambar yang ingin diproses. Hubungi Admin untuk melakukan Top-Up kuota.
              </p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-red-600 text-white font-bold py-3.5 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                Mengerti
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}