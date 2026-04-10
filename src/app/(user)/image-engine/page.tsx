/* eslint-disable @next/next/no-img-element */
// src/app/(user)/image-engine/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { generateImageWithToken } from "../actions";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, Settings2, Play, AlertCircle, Loader2, Image as ImageIcon, 
  Sparkles, Download, X, Maximize2, Cpu, Upload
} from "lucide-react";

// --- TYPES & ENUMS ---
export enum DesignStyle {
  PLAYFUL_DOODLE = "Playful Doodle Sketch",
  CLEAN_FLAT_VECTOR = "Professional Flat Vector",
  RUBBER_HOSE_RETRO = "Rubber Hose Retro Cartoon",
  BOTANICAL_ELEGANCE = "Botanical & Floral Elegance",
  WHIMSICAL_STORYBOOK = "Whimsical Storybook Character",
  MODERN_CHARACTER_FLAT = "Modern Flat Character",
  ORGANIC_LINE_ART = "Organic Minimalist Line Art",
  CUTE_KAWAII_STAMP = "Cute Kawaii Sticker Style",
  SILHOUETTE = "Silhouette",
  SEAMLESS_PATTERN = "Seamless Pattern"
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  WIDE = "16:9"
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  pose: string;
  title: string;
  timestamp: number;
}

// --- CONSTANTS YANG DIPERBARUI (MICROSTOCK READY) ---
const TOTAL_IMAGES = 10;
const BATCH_SIZE = 2; 
const INTER_BATCH_DELAY_MS = 2000;

// Variasi untuk aset desain umum
const ASSET_VARIATIONS = [
  "centered composition, clean minimal design", "isometric perspective, 3D illusion", "flat design with subtle drop shadow",
  "symmetrical and balanced layout", "dynamic action angle", "circular badge style layout",
  "vertical tall arrangement", "scattered floating elements around", "layered paper-cut depth effect",
  "geometric abstract interpretation", "organic fluid and wavy shapes", "monochrome ink style",
  "vibrant pop-art multi-color", "soft pastel shading", "bold thick uniform outlines",
  "flat fill colors without outlines", "deconstructed abstract interpretation", "stylized decorative ornate version",
  "clean vector path style", "professional editorial stock quality"
];

// Variasi khusus untuk karakter (Pose & Ekspresi)
const CHARACTER_VARIATIONS = [
  "front facing view, friendly neutral pose", "side profile view, active walking pose", "three-quarter angle, energetic waving",
  "dynamic action pose, jumping up", "relaxed sitting pose, peaceful", "close-up portrait, very happy expression",
  "holding a generic blank sign", "standing confident, bold stance", "top-down isometric view, playful",
  "wearing cute accessories", "pointing forward gesture", "surprised and amazed expression",
  "thinking pose with hand on chin", "surrounded by tiny magical sparkles", "welcoming greeting gesture",
  "holding a generic heart shape", "zen meditative yoga pose", "using generic technology device",
  "retro aesthetic outfit", "running fast motion blur effect"
];

// Variasi untuk pola (Pattern)
const PATTERN_VARIATIONS = [
  "dense intricate repeatable pattern", "sparse minimalist scattered pattern", "geometric grid structured pattern",
  "organic flowing seamless pattern", "high-contrast monochrome repeatable pattern", "vibrant colorful repeating pattern",
  "subtle soft background pattern", "bold large-scale motif pattern", "diagonal repeating structured pattern",
  "kaleidoscopic radial mandala pattern"
];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ImageEnginePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  const [prompt, setPrompt] = useState("Cute whimsical character set");
  const [style, setStyle] = useState<DesignStyle>(DesignStyle.PLAYFUL_DOODLE);
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTokenAlert, setShowTokenAlert] = useState(false);

  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- HANDLERS UNTUK REFERENCE IMAGE ---
  const processFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Tolong unggah file gambar yang valid.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setReferenceImage(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (isGenerating) return;
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [isGenerating, processFile]);

  // --- LOGIKA GENERATE BATCH ---
  const handleGenerate = useCallback(async () => {
    if (!prompt || !userId) return;

    if (tokenBalance < TOTAL_IMAGES) {
      setShowTokenAlert(true);
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setImages([]); 
    setError(null);
    isCancelledRef.current = false;

    let completedCount = 0;
    let currentToken = tokenBalance;
    
    let variationList = ASSET_VARIATIONS;
    if ([DesignStyle.RUBBER_HOSE_RETRO, DesignStyle.WHIMSICAL_STORYBOOK, DesignStyle.MODERN_CHARACTER_FLAT].includes(style)) {
      variationList = CHARACTER_VARIATIONS;
    } else if (style === DesignStyle.SEAMLESS_PATTERN) {
      variationList = PATTERN_VARIATIONS;
    }

    const generateOne = async (index: number) => {
        if (isCancelledRef.current) return;

        try {
            const variation = variationList[index % variationList.length];
            const refinedPrompt = prompt.toLowerCase().replace(/buat foto|buatkan gambar/gi, "").trim();

            let finalPrompt = "";
            if (style === DesignStyle.SEAMLESS_PATTERN) {
                finalPrompt = `A seamless vector pattern design of ${refinedPrompt || style}. Art Style: ${style}. Variation detail: ${variation}. It must be perfectly tileable.`;
            } else if (style === DesignStyle.SILHOUETTE) {
                finalPrompt = `A single solid black silhouette illustration of ${refinedPrompt || style}. Art Style: ${style}. Variation detail: ${variation}. High contrast.`;
            } else {
                finalPrompt = `A single isolated illustration of ${refinedPrompt || style}. Art Style: ${style}. Variation detail: ${variation}.`;
            }

            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("prompt", finalPrompt);
            formData.append("ratio", ratio);
            if (referenceImage) formData.append("referenceImage", referenceImage);

            const result = await generateImageWithToken(formData);

            if (result.success && result.imageUrl) {
              const newImage: GeneratedImage = {
                  id: crypto.randomUUID(),
                  url: result.imageUrl,
                  prompt: refinedPrompt,
                  style,
                  pose: variation,
                  title: `VARIATION ${index + 1}`,
                  timestamp: Date.now(),
              };
              setImages(prev => [...prev, newImage]);
              
              if (result.newTokenBalance !== undefined) {
                currentToken = result.newTokenBalance;
                setTokenBalance(currentToken);
                window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { detail: { newTokenBalance: currentToken } }));
              }
            } else {
              throw new Error(result.error || "Gagal menghasilkan gambar.");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan tidak dikenal";
            console.error(`Failed to generate image ${index + 1}`, errorMessage);
            setError("Gagal memproses beberapa gambar. Pastikan kuota cukup atau coba lagi.");
        } finally {
            completedCount++;
            setProgress(completedCount);
        }
    };

    const tasks = Array.from({ length: TOTAL_IMAGES }, (_, i) => i);
    
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        if (isCancelledRef.current) break;
        const batch = tasks.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(idx => generateOne(idx)));
        
        if (i + BATCH_SIZE < tasks.length && !isCancelledRef.current) {
          await sleep(INTER_BATCH_DELAY_MS);
        }
    }

    setIsGenerating(false);
  }, [prompt, style, ratio, referenceImage, userId, tokenBalance]);

  const progressPercent = Math.min((progress / TOTAL_IMAGES) * 100, 100);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
      
      {/* Header Premium - Emerald Theme */}
      <div className="relative group overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-transparent opacity-50" />
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-r from-emerald-400 to-teal-500" />
        
        <div className="relative bg-card/60 backdrop-blur-2xl border border-white/10 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-[0_8px_30px_rgba(0,0,0,0.2)]">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-white/5 shadow-inner">
                <Palette className="w-6 h-6" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">AI Image Engine</h1>
            </div>
            <p className="text-muted-foreground text-base max-w-xl font-medium leading-relaxed">
              Buat puluhan variasi aset desain, ilustrasi, dan pattern secara otomatis untuk meningkatkan volume portofolio microstock Anda.
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
        
        {/* KOLOM KIRI: KONFIGURASI (SUDAH DIPERBARUI AGAR TIDAK SCROLL) */}
        <div className="lg:col-span-4 bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)] relative overflow-hidden flex flex-col h-fit">
          <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-inner">
                <Settings2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Design Rules</h2>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Style Library</label>
              {/* Diubah menjadi flex-wrap agar membentuk desain "Chips/Pills" yang rapi */}
              <div className="flex flex-wrap gap-2">
                {Object.values(DesignStyle).map((ds) => (
                  <button
                    key={ds}
                    onClick={() => setStyle(ds)}
                    disabled={isGenerating}
                    className={`flex-grow text-center px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                      style === ds
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                        : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {ds}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Maximize2 size={14}/> Aspect Ratio</label>
              {/* Diubah menjadi grid 4 kolom agar memanjang ke samping (hanya makan 1 baris) */}
              <div className="grid grid-cols-4 gap-2">
                {Object.values(AspectRatio).map((r) => (
                  <button
                    key={r} onClick={() => setRatio(r)} disabled={isGenerating}
                    className={`px-2 py-2 rounded-lg text-[11px] font-mono font-bold transition-all border text-center ${
                      ratio === r ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-black/40 text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/10">
               <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Reference DNA (Opsional)</label>
               {/* Dikurangi tingginya sedikit menjadi h-28 agar muat sempurna tanpa scroll */}
               <div 
                  onClick={() => !isGenerating && fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e)=>e.preventDefault()}
                  className={`relative w-full h-28 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''} ${referenceImage ? 'border-emerald-500/50' : ''}`}
                >
                  {referenceImage ? (
                    <>
                      <img src={referenceImage} alt="Reference" className="w-full h-full object-cover rounded-xl opacity-80 relative z-10" />
                      <button onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }} className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg z-20 hover:scale-110"><X size={12} /></button>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-2"><Upload size={16} className="text-white/40" /></div>
                      <div className="text-[10px] font-bold text-gray-400 uppercase">Upload Reference</div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} disabled={isGenerating} />
               </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: WORKSPACE */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex flex-col relative">
             <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><Cpu size={100}/></div>
             <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14}/> System Prompt</label>
             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder="Deskripsikan subjek utama Anda (contoh: Cute cat playing with yarn)..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-4 text-lg font-medium text-white placeholder-white/20 resize-none h-32 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 shadow-inner custom-scrollbar relative z-10"
              />
              
              <div className="mt-6 flex flex-col space-y-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                  className={`w-full relative overflow-hidden group/btn text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:scale-[1.01] active:scale-95`}
                >
                  <div className="absolute inset-0 w-full h-full transform -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 ease-in-out" />
                  <span className="relative z-10 flex items-center gap-3">
                    {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6 fill-current" />}
                    {isGenerating ? `Membangun Batch... (${progress}/${TOTAL_IMAGES})` : `Generate ${TOTAL_IMAGES} Variasi Asset`}
                  </span>
                </button>

                {isGenerating && (
                  <div className="w-full h-2 bg-black/40 border border-white/10 rounded-full overflow-hidden shadow-inner">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 relative">
                      <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                    </motion.div>
                  </div>
                )}
              </div>
          </div>

          {error && (
             <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-3 text-red-400 font-medium backdrop-blur-md">
               <AlertCircle size={20} /> {error}
             </div>
          )}

          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)] min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/5 rounded-lg border border-white/10 shadow-inner"><ImageIcon className="w-5 h-5 text-gray-300" /></div>
                Output Stream
              </h2>
            </div>

            {images.length === 0 && !isGenerating ? (
               <div className="h-[300px] flex flex-col items-center justify-center text-white/20">
                 <Cpu size={40} className="mb-4 opacity-20" />
                 <p className="text-sm font-mono uppercase tracking-widest text-white/30">System_Idle - Awaiting Input</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {images.map((img, idx) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedImage(img)}
                      className="group relative aspect-square rounded-2xl bg-black/40 border border-white/10 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all shadow-inner hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                    >
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                        <Maximize2 size={24} className="text-white drop-shadow-md" />
                      </div>
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/80 backdrop-blur-md rounded border border-white/20 text-[9px] font-mono text-emerald-400 uppercase font-bold">
                        {img.title}
                      </div>
                    </motion.div>
                  ))}
                  {isGenerating && images.length < TOTAL_IMAGES && (
                     <div className="aspect-square rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center animate-pulse">
                       <Loader2 size={24} className="text-emerald-500/50 animate-spin mb-2" />
                       <span className="text-[9px] text-white/30 uppercase tracking-widest">Generating...</span>
                     </div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL FULL SCREEN */}
      <AnimatePresence>
        {selectedImage && (
          <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>

      {/* ALERT TOKEN HABIS */}
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
                Sisa token Anda: <span className="text-red-400 font-bold">{tokenBalance}</span>. Proses Batch membutuhkan {TOTAL_IMAGES} token.
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

// --- SUB-KOMPONEN MODAL ---
function ImageModal({ image, onClose }: { image: GeneratedImage, onClose: () => void }) {
  const handleDownload = (format: 'png' | 'jpg') => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const TARGET_AREA = 6250000; 
      const originalRatio = img.width / img.height;
      const targetHeight = Math.sqrt(TARGET_AREA / originalRatio);
      canvas.width = Math.round(targetHeight * originalRatio);
      canvas.height = Math.round(targetHeight);
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL(mimeType, format === 'jpg' ? 0.95 : 1.0);
      link.download = `microstock-asset-${image.id}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <motion.button onClick={onClose} className="absolute top-6 right-6 p-3 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/10 z-50">
        <X size={24} />
      </motion.button>

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-card border border-white/10 rounded-[2rem] overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row shadow-[0_0_100px_rgba(16,185,129,0.2)]">
        <div className="flex-[1.5] bg-black/60 flex items-center justify-center p-8 relative min-h-[300px] border-b md:border-b-0 md:border-r border-white/10">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] [background-size:20px_20px] opacity-30" />
          <img src={image.url} alt="Detail" className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl relative z-10" />
        </div>
        
        <div className="w-full md:w-[380px] bg-card p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1 block">Asset Details</span>
              <h3 className="text-xl font-black text-white uppercase">{image.title}</h3>
            </div>
            
            <div className="space-y-6 flex-1">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-2 font-bold">Base Prompt</label>
                    <p className="text-white text-sm font-medium leading-relaxed">&quot;{image.prompt}&quot;</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Style</label>
                    <p className="text-emerald-400 text-xs font-bold uppercase">{image.style}</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest block mb-1">Variation</label>
                    <p className="text-white text-xs font-bold uppercase">{image.pose.split(',')[0]}</p>
                  </div>
                </div>
            </div>

            <div className="mt-8 space-y-3">
                <button onClick={() => handleDownload('png')} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white h-12 rounded-xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg">
                   <Download size={18} /> High-Res PNG
                </button>
                <button onClick={() => handleDownload('jpg')} className="w-full bg-white/5 border border-white/10 text-white hover:bg-white/10 h-12 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all">
                   <Download size={16} /> Standard JPEG
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}