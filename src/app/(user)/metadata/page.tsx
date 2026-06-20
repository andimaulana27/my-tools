// src/app/(user)/metadata/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, Settings2, Play, AlertCircle, Loader2, 
  Image as ImageIcon, CheckCircle2, Sparkles, Layers, 
  Download, X, FileCode, Copy, Check, Zap, Activity, ChevronDown, Camera, PenTool, Grid
} from "lucide-react";
import { processMetadataWithToken } from "../actions/metadata";

type ProcessedFile = {
  id: string;
  file: File;
  originalFileName: string; 
  previewUrl: string;
  status: "pending" | "processing" | "success" | "error";
  metadata?: { 
    title: string; 
    keywords: string; 
    description: string; 
    category?: number | string; 
    folderName?: string;
    fileName?: string;
  };
  errorMessage?: string;
};

type AppMode = "adobe" | "shutterstock" | "canva" | "naming";

const ADOBE_CATEGORIES: Record<number, string> = {
  1: "Animals", 2: "Buildings and Architecture", 3: "Business", 4: "Drinks",
  5: "The Environment", 6: "States of Mind", 7: "Food", 8: "Graphic Resources",
  9: "Hobbies and Leisure", 10: "Industry", 11: "Landscapes", 12: "Lifestyle",
  13: "People", 14: "Plants and Flowers", 15: "Culture and Religion", 16: "Science",
  17: "Social Issues", 18: "Sports", 19: "Technology", 20: "Transport", 21: "Travel"
};

// Kategori disesuaikan 100% dengan screenshot user
const SHUTTERSTOCK_CATEGORIES = [
  "Abstract", "Animals/Wildlife", "Arts", "Backgrounds/Textures", "Beauty/Fashion", 
  "Buildings/Landmarks", "Business/Finance", "Celebrities", "Education", "Food and drink", 
  "Healthcare/Medical", "Holidays", "Industrial", "Interiors", "Miscellaneous", "Nature", 
  "Objects", "Parks/Outdoor", "People", "Religion", "Science", "Signs/Symbols", 
  "Sports/Recreation", "Technology", "Transportation", "Vintage"
];

export default function UnifiedMetadataGenerator() {
  const [mode, setMode] = useState<AppMode>("adobe");
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [imageType, setImageType] = useState<"vector" | "realistic">("vector");

  const [config, setConfig] = useState({
    titleLengthMin: 50,
    titleLengthMax: 100,
    keywordsCount: 49,
    conceptContext: "",
    negativeKeywords: "logo, watermark, text",
    delay: 1000, 
    targetExtension: "auto", 
  });

  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const stopRef = useRef(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [artistName, setArtistName] = useState("");

  const theme = {
    adobe: {
      accent: "text-rose-400",
      badge: "bg-rose-500/10 border-rose-500/20 text-rose-400",
      title: "Adobe Stock Engine",
      desc: "Optimasi judul dan 49 keyword SEO khusus portofolio Adobe Stock."
    },
    shutterstock: {
      accent: "text-orange-500",
      badge: "bg-orange-500/10 border-orange-500/20 text-orange-500",
      title: "Shutterstock Engine",
      desc: "Optimasi deskripsi & 50 keyword spesifik standar kurasi Shutterstock."
    },
    canva: {
      accent: "text-cyan-400",
      badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
      title: "Canva Metadata Engine",
      desc: "Rekomendasi deskripsi dan keyword elemen sesuai standar Canva Creator."
    },
    naming: {
      accent: "text-indigo-400",
      badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400",
      title: "File Naming Recommender",
      desc: "Analisis cerdas untuk penamaan folder project dan file master mentahan."
    }
  }[mode];

  const updateMetadata = <K extends keyof NonNullable<ProcessedFile["metadata"]>>(
    id: string,
    field: K,
    value: NonNullable<ProcessedFile["metadata"]>[K]
  ) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, metadata: f.metadata ? { ...f.metadata, [field]: value } : undefined }
          : f
      )
    );
  };

  const handleModeChange = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === "adobe") {
      setConfig(prev => ({ ...prev, keywordsCount: 49, titleLengthMax: 100, titleLengthMin: 50, negativeKeywords: "logo, watermark, text" }));
    } else if (newMode === "shutterstock") {
      setConfig(prev => ({ ...prev, keywordsCount: 50, titleLengthMax: 200, titleLengthMin: 20, negativeKeywords: "logo, watermark, text, brand" }));
    } else if (newMode === "canva") {
      setConfig(prev => ({ ...prev, keywordsCount: 20, titleLengthMax: 50, negativeKeywords: "logo, watermark, text, brand" }));
    }
  };

  useEffect(() => {
    async function fetchUser() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setUserId(authData.user.id);
        const { data: profile } = await supabase.from("profiles").select("token_balance").eq("id", authData.user.id).single();
        if (profile) setTokenBalance(profile.token_balance);
      }
    }
    fetchUser();
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addFiles = useCallback(async (uploaded: File[]) => {
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
                ctx.clearRect(0, 0, canvas.width, canvas.height); 
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
        } catch (err: unknown) {
          console.error("Gagal konversi SVG:", err);
        }
      }

      return {
        id: Math.random().toString(36).substring(7),
        file: processedFile,
        originalFileName: file.name,
        previewUrl: URL.createObjectURL(processedFile),
        status: "pending",
      };
    }));

    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const ext = file.type === 'image/png' ? 'png' : 'jpg';
            const newFile = new File([file], `Screenshot_${Math.floor(Date.now() / 1000)}.${ext}`, { type: file.type });
            pastedFiles.push(newFile);
          }
        }
      }
      
      if (pastedFiles.length > 0) {
        addFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [addFiles]);

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
      formData.append("imageType", imageType); 
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

  useEffect(() => {
    if (mode === "naming" && !isProcessing) {
      const hasPendingFiles = files.some(f => f.status === "pending");
      if (hasPendingFiles && tokenBalance > 0) {
        processBatch();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, mode, isProcessing, tokenBalance]);

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.previewUrl));
    setFiles([]);
  };

  const getFilenameWithTargetExtension = (originalName: string, targetExt: string) => {
    if (targetExt === "auto") return originalName;
    const base = originalName.replace(/\.[^/.]+$/, "");
    return `${base}.${targetExt}`;
  };

  const handleExport = (e: React.FormEvent) => {
    e.preventDefault();
    const successFiles = files.filter(f => f.status === "success");
    if (successFiles.length === 0) return;

    let csvContent = '';
    const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;

    if (mode === "adobe") {
      const headers = ['Filename', 'Title', 'Keywords', 'Category', 'Releases'];
      const rows = successFiles.map(f => {
        const finalFileName = getFilenameWithTargetExtension(f.originalFileName, config.targetExtension);
        return [
          escape(finalFileName),
          escape(f.metadata?.title || ''),
          escape(f.metadata?.keywords || ''),
          f.metadata?.category || 8, 
          '""'
        ];
      });
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (mode === "shutterstock") {
      const headers = ['Filename', 'Description', 'Keywords', 'Categories', 'Illustration', 'Mature Content', 'Editorial'];
      const rows = successFiles.map(f => {
        const finalFileName = getFilenameWithTargetExtension(f.originalFileName, config.targetExtension);
        const isIllustration = imageType === 'vector' ? 'Yes' : 'No';
        
        // Memastikan fallback kategori jika AI memberikan hasil yang tidak sesuai daftar
        const aiCategory = String(f.metadata?.category || 'Abstract');
        const finalCategory = SHUTTERSTOCK_CATEGORIES.includes(aiCategory) ? aiCategory : 'Abstract';

        return [
          escape(finalFileName),
          escape(f.metadata?.title || ''), 
          escape(f.metadata?.keywords || ''),
          escape(finalCategory),
          `"${isIllustration}"`,
          '"No"',
          '"No"'
        ];
      });
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    } else if (mode === "canva") {
      const headers = ['filename', 'title', 'keywords', 'Artist', 'locale', 'description'];
      const rows = successFiles.map(f => {
        const keywordsArray = (f.metadata?.keywords || '').split(',').map(k => k.trim()).filter(k => k.length > 0);
        const limitedKeywords = keywordsArray.slice(0, 20).join(', ');
        const finalFileName = getFilenameWithTargetExtension(f.originalFileName, config.targetExtension);
        
        return [
          escape(finalFileName),
          escape(f.metadata?.title || ''),
          escape(limitedKeywords),
          escape(artistName || ''), 
          '"en"',
          escape(f.metadata?.description || f.metadata?.title || '')
        ];
      });
      csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    }

    const rawFirstName = successFiles[0].originalFileName.replace(/\.[^/.]+$/, "");
    let baseName = rawFirstName.replace(/[-_\s]*\d+$/, '').replace(/\(\d+\)$/, '').trim();
    if (!baseName) baseName = rawFirstName || "batch_metadata";

    const downloadName = `${baseName}_${mode}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
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
      className="max-w-7xl mx-auto space-y-8 relative z-10 pb-10"
    >
      <div className="flex bg-black/40 border border-white/5 p-1 rounded-xl w-fit shadow-inner overflow-x-auto custom-scrollbar">
        <button
          onClick={() => handleModeChange("adobe")}
          className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
            mode === "adobe" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Layers className="w-4 h-4" />
          Adobe Stock
        </button>
        <button
          onClick={() => handleModeChange("shutterstock")}
          className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
            mode === "shutterstock" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Grid className="w-4 h-4" />
          Shutterstock
        </button>
        <button
          onClick={() => handleModeChange("canva")}
          className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
            mode === "canva" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Canva
        </button>
        <button 
          onClick={() => handleModeChange("naming")} 
          className={`px-6 py-2 rounded-lg text-[13px] font-bold transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
            mode === "naming" ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <FileCode className="w-4 h-4" /> 
          File Naming
        </button>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5">
        <div className="relative p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className={`p-2 rounded-lg border ${theme.badge}`}>
                <Zap className="w-5 h-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{theme.title}</h1>
            </div>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed max-w-xl">
              {theme.desc}
            </p>
          </div>
          <div className="flex flex-col md:items-end bg-black/20 border border-white/5 p-4 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
               <Activity className="w-3 h-3"/> Active Quota
            </span>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${tokenBalance > 0 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span className="font-mono font-bold text-xl text-zinc-200">{tokenBalance} <span className="text-xs font-sans text-zinc-500">Tokens</span></span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className={`lg:col-span-4 bg-white/[0.01] border border-white/5 rounded-3xl p-6 transition-all duration-500 ${mode === 'naming' ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <Settings2 className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-bold text-zinc-200">Generation Rules</h2>
            </div>
            <span className="text-[9px] font-bold bg-white/5 px-2 py-1 rounded text-zinc-400 uppercase tracking-widest border border-white/5">
              Sequential
            </span>
          </div>

          <div className="space-y-5">
            <div className="space-y-1.5 pb-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Camera size={14}/> Jenis Aset
              </label>
              <div className="flex bg-black/20 border border-white/5 rounded-lg p-1">
                <button
                  onClick={() => setImageType('vector')}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
                    imageType === 'vector' ? 'bg-zinc-100 text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <PenTool size={14} /> Vector / Art
                </button>
                <button
                  onClick={() => setImageType('realistic')}
                  disabled={isProcessing}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-md transition-all ${
                    imageType === 'realistic' ? 'bg-zinc-100 text-black shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Camera size={14} /> Realistic Photo
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Extension Override</label>
              <select 
                value={config.targetExtension} 
                onChange={e => setConfig({...config, targetExtension: e.target.value})} 
                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-white/20 transition-all cursor-pointer appearance-none"
              >
                <option value="auto">Auto (Bawaan File)</option>
                <option value="eps">.eps (Master Vektor)</option>
                <option value="jpg">.jpg (Foto/Raster)</option>
                <option value="png">.png (Raster Transparan)</option>
                <option value="svg">.svg (Vektor SVG)</option>
              </select>
              <p className="text-[10px] text-zinc-600 font-medium pt-1">Ekstensi otomatis terganti saat di-export ke CSV.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Min Length</label>
                <input type="number" value={config.titleLengthMin} onChange={e => setConfig({...config, titleLengthMin: Number(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-white/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Max Length</label>
                <input type="number" value={config.titleLengthMax} onChange={e => setConfig({...config, titleLengthMax: Number(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-white/20 transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Keywords</label>
              <input type="number" value={config.keywordsCount} onChange={e => setConfig({...config, keywordsCount: Number(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-white/20 transition-all" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Context (Optional)</label>
              <textarea 
                value={config.conceptContext} 
                onChange={e => setConfig({...config, conceptContext: e.target.value})} 
                placeholder="e.g., vector set bundle..." 
                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 h-20 resize-none focus:outline-none focus:border-white/20 transition-all" 
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Negative Terms</label>
              <textarea value={config.negativeKeywords} onChange={e => setConfig({...config, negativeKeywords: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 h-16 resize-none focus:outline-none focus:border-white/20 transition-all" />
            </div>

            <div className="space-y-1.5 pt-4 border-t border-white/5">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">API Delay (ms)</label>
              <input 
                type="number" 
                step="500" min="500"
                value={config.delay} 
                onChange={e => setConfig({...config, delay: Number(e.target.value)})} 
                className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2.5 text-sm font-mono text-zinc-200 focus:outline-none focus:border-white/20 transition-all" 
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between mb-5 gap-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-zinc-400" />
                Asset Workspace
              </h2>
              <div className="flex items-center gap-3">
                {mode !== 'naming' && successCount > 0 && (
                  <button 
                    onClick={() => setIsExportModalOpen(true)} 
                    disabled={isProcessing} 
                    className="text-xs font-bold bg-zinc-100 text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-white transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export CSV ({successCount})
                  </button>
                )}
                {files.length > 0 && (
                  <button onClick={clearAll} disabled={isProcessing} className="text-xs font-bold text-zinc-400 hover:text-zinc-200 hover:bg-white/5 px-3 py-2 rounded-lg transition-colors border border-transparent">
                    Clear Board
                  </button>
                )}
              </div>
            </div>

            <label 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex flex-col items-center justify-center w-full h-48 border border-dashed rounded-xl cursor-pointer transition-all duration-300 group ${
                isDragging ? "border-white/30 bg-white/[0.02]" : "border-white/10 bg-black/20 hover:bg-white/[0.02] hover:border-white/20"
              }`}
            >
              <div className={`p-4 rounded-full mb-3 transition-colors ${isDragging ? "bg-white/10" : "bg-white/5 group-hover:bg-white/10"}`}>
                <UploadCloud className={`w-6 h-6 ${isDragging ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
              </div>
              <p className="text-sm text-zinc-200 font-bold">
                 {mode === "naming" ? "Paste image (Ctrl+V) or Drag & Drop" : "Drag & Drop files here or Paste (Ctrl+V)"}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1.5 font-mono uppercase tracking-widest">Supports Standard Image & SVG</p>
              <input type="file" multiple accept="image/*" onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <button 
                    onClick={processBatch} 
                    disabled={isProcessing || doneCount === totalCount}
                    className="flex-1 bg-zinc-100 text-black py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-white transition-all active:scale-[0.98]"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                    {isProcessing ? "Processing Elements..." : doneCount === totalCount ? "Task Completed" : mode === 'naming' ? `Run Auto-Naming (${files.filter(f => f.status === 'pending' || f.status === 'error').length} Token)` : `Run Generator (${files.filter(f => f.status === 'pending' || f.status === 'error').length} Token)`}
                  </button>
                  {isProcessing && (
                    <button onClick={() => stopRef.current = true} className="px-6 py-3 bg-black/40 border border-white/5 text-zinc-300 rounded-xl font-bold hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 transition-all text-sm">
                      Stop
                    </button>
                  )}
                </div>

                {(isProcessing || doneCount > 0) && (
                  <div className="pt-4 border-t border-white/5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sync Progress</span>
                      <span className="text-xs font-mono font-bold text-zinc-300">{doneCount} / {totalCount}</span>
                    </div>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-zinc-200 transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {files.map((file) => (
              <motion.div key={file.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-5 p-5 border border-white/5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.02] transition-colors group">
                
                <div className="w-full sm:w-32 h-32 shrink-0 rounded-xl overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={file.previewUrl} alt="preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  {file.status === "processing" && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
                    </div>
                  )}
                  {file.status === "success" && (
                    <div className="absolute top-2 right-2 bg-emerald-500/20 border border-emerald-500/30 rounded-md p-1 backdrop-blur-md">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {file.status === "pending" && <p className="text-zinc-500 font-medium text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Queued for processing...</p>}
                  {file.status === "error" && <p className="text-rose-400 font-medium text-xs flex items-center gap-2 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 w-fit"><AlertCircle className="w-3.5 h-3.5"/> {file.errorMessage}</p>}
                  
                  {file.status === "success" && file.metadata && (
                    <div className="space-y-3">
                      {mode === "naming" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                           <div className="space-y-1.5">
                             <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Folder (Kebab)</span><button onClick={() => copyToClipboard(file.metadata?.folderName || '', `f-${file.id}`)} className="text-zinc-600 hover:text-zinc-300 transition-colors">{copiedId === `f-${file.id}` ? <Check size={12}/> : <Copy size={12}/>}</button></div>
                             <p className="text-xs text-zinc-300 font-mono bg-black/40 border border-white/5 px-3 py-2.5 rounded-lg break-all">{file.metadata?.folderName || ""}</p>
                           </div>
                           <div className="space-y-1.5">
                             <div className="flex items-center justify-between"><span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">File (Snake)</span><button onClick={() => copyToClipboard(file.metadata?.fileName || '', `m-${file.id}`)} className="text-zinc-600 hover:text-zinc-300 transition-colors">{copiedId === `m-${file.id}` ? <Check size={12}/> : <Copy size={12}/>}</button></div>
                             <p className="text-xs text-zinc-300 font-mono bg-black/40 border border-white/5 px-3 py-2.5 rounded-lg break-all">{file.metadata?.fileName || ""}</p>
                           </div>
                           <div className="md:col-span-2 space-y-1.5 pt-1">
                             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Display Title</span>
                             <p className="text-sm text-zinc-200 font-semibold">{file.metadata?.title || ""}</p>
                           </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Generated Title / Description</span>
                              <span className="text-[9px] font-mono font-medium text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{(file.metadata?.title || "").length} chars</span>
                            </div>
                            <textarea 
                              value={file.metadata?.title || ""}
                              onChange={(e) => updateMetadata(file.id, "title", e.target.value)}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-semibold text-zinc-200 focus:outline-none focus:border-white/20 transition-all resize-none h-16 custom-scrollbar"
                            />
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">SEO Keywords</span>
                              <span className="text-[9px] font-mono font-medium text-zinc-500 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">{(file.metadata?.keywords || "").split(',').filter(k => k.trim() !== "").length} tags</span>
                            </div>
                            <textarea 
                              value={file.metadata?.keywords || ""}
                              onChange={(e) => updateMetadata(file.id, "keywords", e.target.value)}
                              className="w-full bg-black/20 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-400 font-medium focus:outline-none focus:border-white/20 transition-all resize-none h-20 leading-relaxed custom-scrollbar"
                            />
                          </div>

                          {mode === "adobe" && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block px-1">AI Category Match</span>
                              <div className="relative group/select w-fit">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                                  <Layers className="w-3.5 h-3.5 text-zinc-500" />
                                </div>
                                <select 
                                  value={file.metadata?.category || 8}
                                  onChange={(e) => updateMetadata(file.id, "category", parseInt(e.target.value))}
                                  className="w-full bg-white/5 border border-white/5 pl-9 pr-8 py-2 rounded-lg text-xs font-bold text-zinc-300 outline-none hover:bg-white/10 focus:border-white/20 transition-all appearance-none cursor-pointer relative z-0"
                                >
                                  {Object.entries(ADOBE_CATEGORIES).map(([id, name]) => (
                                    <option key={id} value={id} className="bg-[#121212] text-zinc-200 font-medium">
                                      {name} (ID: {id})
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover/select:text-zinc-300 transition-colors" />
                                </div>
                              </div>
                            </div>
                          )}

                          {mode === "shutterstock" && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block px-1">Shutterstock Category</span>
                              <div className="relative group/select w-fit">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
                                  <Grid className="w-3.5 h-3.5 text-zinc-500" />
                                </div>
                                <select 
                                  value={file.metadata?.category || "Abstract"}
                                  onChange={(e) => updateMetadata(file.id, "category", e.target.value)}
                                  className="w-full min-w-[200px] bg-white/5 border border-white/5 pl-9 pr-8 py-2 rounded-lg text-xs font-bold text-zinc-300 outline-none hover:bg-white/10 focus:border-white/20 transition-all appearance-none cursor-pointer relative z-0"
                                >
                                  {SHUTTERSTOCK_CATEGORIES.map((catName) => (
                                    <option key={catName} value={catName} className="bg-[#121212] text-zinc-200 font-medium">
                                      {catName}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none">
                                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover/select:text-zinc-300 transition-colors" />
                                </div>
                              </div>
                            </div>
                          )}
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

      <AnimatePresence>
        {isExportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-white/5 flex justify-between items-center">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-zinc-500" /> Export Data
                </h3>
                <button onClick={() => setIsExportModalOpen(false)} className="text-zinc-500 hover:text-white p-1.5 rounded-md transition-colors hover:bg-white/5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <form onSubmit={handleExport} className="p-6 space-y-5">
                <div className="text-center bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">Ready to Download</span>
                  <span className="text-3xl font-mono text-zinc-200 font-bold">{successCount} <span className="text-sm font-sans text-zinc-500">Rows</span></span>
                </div>

                {mode === "canva" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Artist Brand Name</label>
                    <input
                      type="text"
                      required
                      value={artistName}
                      onChange={(e) => setArtistName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-lg py-2.5 px-3 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                      placeholder="e.g., Studio Desain"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-zinc-100 text-black font-bold text-sm rounded-lg py-3 mt-2 hover:bg-white active:scale-[0.98] transition-all"
                >
                  Download .CSV
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-2xl shadow-2xl p-8 text-center">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Insufficient Quota</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Anda hanya memiliki <span className="text-rose-400 font-bold">{tokenBalance} Tokens</span>. Jumlah ini kurang dari antrean file yang Anda minta.
              </p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-white/5 border border-white/10 text-white font-bold text-sm py-3 rounded-lg hover:bg-white/10 transition-colors">
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}