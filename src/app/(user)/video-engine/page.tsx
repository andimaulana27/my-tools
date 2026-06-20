// src/app/(user)/video-engine/page.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, Play, Square, Download, Settings2, Monitor, Code2, 
  Sparkles, Loader2, AlertCircle, Trash2, Maximize2, Zap, Command,
  Layers, Activity, Wand2, FileText 
} from "lucide-react";

import { generateVideoCodeWithToken, generateMagicVideoIdeaFromGemini } from "../actions/video";

interface CustomHTMLCanvasElement extends HTMLCanvasElement {
  captureStream(frameRate?: number): MediaStream;
}

const ADOBE_CATEGORIES = [
  { id: 1, name: "Animals" }, { id: 2, name: "Buildings and Architecture" }, { id: 3, name: "Business" },
  { id: 4, name: "Drinks" }, { id: 5, name: "The Environment" }, { id: 6, name: "States of Mind" },
  { id: 7, name: "Food" }, { id: 8, name: "Graphic Resources" }, { id: 9, name: "Hobbies and Leisure" },
  { id: 10, name: "Industry" }, { id: 11, name: "Landscapes" }, { id: 12, name: "Lifestyle" },
  { id: 13, name: "People" }, { id: 14, name: "Plants and Flowers" }, { id: 15, name: "Culture and Religion" },
  { id: 16, name: "Science" }, { id: 17, name: "Social Issues" }, { id: 18, name: "Sports" },
  { id: 19, name: "Technology" }, { id: 20, name: "Transport" }, { id: 21, name: "Travel" }
];

export default function VideoEnginePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);

  const [aiPrompt, setAiPrompt] = useState("");
  
  const [engine, setEngine] = useState("");
  const [style, setStyle] = useState("");
  const [shape, setShape] = useState("");
  
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);
  const [ideaHistory, setIdeaHistory] = useState<string[]>([]);
  
  const [code, setCode] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordDuration, setRecordDuration] = useState(10);
  
  const [resolution, setResolution] = useState({ w: 3840, h: 2160 });
  const [renderScale, setRenderScale] = useState(1);
  const [bitrate, setBitrate] = useState(120);
  
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("8");
  const [lastRecordedFilename, setLastRecordedFilename] = useState("");
  // Menyimpan ekstensi codec yang berjalan agar presisi untuk manual CSV export
  const [currentExtension, setCurrentExtension] = useState("mp4"); 
  const [error, setError] = useState<string | null>(null);
  const [showTokenAlert, setShowTokenAlert] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const is4K = resolution.w === 3840 || resolution.h === 3840;

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

  const sanitizeFilename = (str: string) => {
    return str.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase().substring(0, 50);
  };

  const getBaseFilename = () => {
    const safeTitle = title ? sanitizeFilename(title) : `microstock-video`;
    return `${safeTitle}-${resolution.w}x${resolution.h}`;
  };

  const isSelectionComplete = engine !== "" && style !== "" && shape !== "";

  const handleMagicIdea = async () => {
    if (!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading) return;
    
    setIsMagicLoading(true);
    try {
      const res = await generateMagicVideoIdeaFromGemini(engine, style, shape, ideaHistory);
      
      if (res.success && res.idea) {
        setRecordDuration(res.idea.duration || 10);
        setAiPrompt(res.idea.prompt || "");
        
        setIdeaHistory(prev => {
           const newHistory = [...prev, res.idea.prompt];
           return newHistory.slice(-15);
         });
      } else {
        setAiPrompt(`Seamless looping ${engine} animation with ${style} ${shape}, highly detailed for RTX 3060`);
      }
    } catch (err) {
      console.error("Error fetching magic idea:", err);
    } finally {
      setIsMagicLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    if (!userId || !aiPrompt || !isSelectionComplete) return;
    
    if (tokenBalance < 1) {
      setShowTokenAlert(true);
      return;
    }

    setIsGeneratingCode(true);
    setError(null);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("prompt", aiPrompt);
    formData.append("engine", engine);
    formData.append("style", style);
    formData.append("shape", shape);
    formData.append("duration", recordDuration.toString());

    const result = await generateVideoCodeWithToken(formData);

    if (result.success && result.code) {
      setCode(result.code);
      if (result.title) setTitle(result.title);
      if (result.keywords) setKeywords(result.keywords);
      if (result.category) setCategory(result.category);
      
      if (result.newTokenBalance !== undefined) {
        setTokenBalance(result.newTokenBalance);
        window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { detail: { newTokenBalance: result.newTokenBalance } }));
      }
    } else {
      if (result.error === "INSUFFICIENT_TOKENS") setShowTokenAlert(true);
      else setError(result.error || "Gagal menghasilkan kode AI. Pastikan AI merespons JSON yang valid.");
    }
    setIsGeneratingCode(false);
  };

  const generatePreviewDoc = (jsCode: string, res: { w: number, h: number }, scale: number) => {
    const forcedCode = jsCode
      .replace(/window\.innerWidth/g, `${res.w}`)
      .replace(/window\.innerHeight/g, `${res.h}`);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.3.2/pixi.min.js"></script>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
          <style>
            body { 
              margin: 0; padding: 0; background: #000; 
              width: 100vw; height: 100vh; overflow: hidden;
              display: flex; justify-content: center; align-items: center; 
            }
            canvas { 
              width: 100% !important; 
              height: 100% !important; 
              object-fit: contain !important; 
              image-rendering: optimizeQuality;
              color-interpolation: sRGB;
            }
          </style>
          <script>
            window.RENDER_SCALE = ${scale};
          </script>
        </head>
        <body>
          <script>
            try {
              ${forcedCode}
            } catch (e) {
              console.error("Canvas Error:", e);
              window.parent.postMessage({ type: 'error', message: e.message }, '*');
            }
          </script>
        </body>
      </html>
    `;
  };

  const handleRunPreview = () => {
    setError(null);
    setIsPreviewing(true);
  };

  const handleStopPreview = () => {
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsPreviewing(false);
    setIsRecording(false);
  };

  const startRecording = () => {
    if (!iframeRef.current) return;
    const canvas = iframeRef.current.contentDocument?.querySelector('canvas');
    if (!canvas) {
      setError("Canvas tidak ditemukan di preview. Pastikan kode menggambar ke canvas.");
      return;
    }

    try {
      const codecsToTry = [
        "video/mp4;codecs=avc1.640034", 
        "video/mp4;codecs=avc1.4D4028", 
        "video/mp4;codecs=avc1",               
        "video/webm;codecs=vp9",
        "video/mp4",
        "video/webm"
      ];

      let selectedMimeType = "";
      for (const mimeType of codecsToTry) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      if (!selectedMimeType) {
        setError("Browser Anda tidak mendukung perekaman HW-Accel secara bawaan. Pastikan Anda menggunakan Chrome/Edge versi terbaru.");
        return;
      }

      const isWebm = selectedMimeType.includes("webm");
      const fileExt = isWebm ? "webm" : "mp4";
      setCurrentExtension(fileExt); // Simpan ekstensi untuk file metadata
      
      const finalFilename = `${getBaseFilename()}.${fileExt}`;
      setLastRecordedFilename(finalFilename);

      const stream = (canvas as CustomHTMLCanvasElement).captureStream(60); 
      const recorder = new MediaRecorder(stream, { 
        mimeType: selectedMimeType,
        videoBitsPerSecond: bitrate * 1000000 
      });
      
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { 
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data); 
        }
      };

      recorder.onerror = (event: Event & { error?: Error }) => {
        console.error("MediaRecorder Error Details:", event.error || event);
        setError(`Perekaman Terhenti Paksa: ${event.error?.message || "Mesin GPU Browser gagal merender (Overload)."}`);
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        
        if (blob.size === 0) {
          setError("Gagal merender video (0 byte). GPU/VRAM Browser overload. Silakan muat ulang halaman.");
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = finalFilename; 
          a.click();
          
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
        
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = recorder;
      
      setIsRecording(true); 
      
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "inactive") {
          mediaRecorderRef.current.start(250); 
        }
      }, 1000);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }, (recordDuration * 1000) + 1000);

    } catch (err: unknown) {
      console.error(err);
      setError("Sistem mengalami kesalahan saat inisialisasi Codec.");
      setIsRecording(false);
    }
  };

  const downloadCSV = () => {
    const escapeCsv = (str: string) => `"${str.replace(/"/g, '""')}"`;
    const header = "Filename,Title,Keywords,Category,Releases\n";
    
    // Pastikan Filename secara akurat merekam nama dan ekstensinya
    const currentFilename = lastRecordedFilename || `${getBaseFilename()}.${currentExtension}`;
    
    // Menghapus spasi yang tidak disengaja dan format yang salah
    const safeTitle = title.trim();
    const safeKeywords = keywords.split(',').map(k => k.trim()).filter(k => k !== '').join(',');
    
    const row = `${escapeCsv(currentFilename)},${escapeCsv(safeTitle)},${escapeCsv(safeKeywords)},${category},""\n`;
    
    // PERBAIKAN: Penambahan BOM (\ufeff) mencegah CSV corrupt dan memastikannya bisa di-load oleh Adobe Stock dan terbaca Excel dengan sempurna.
    const blob = new Blob(['\ufeff' + header + row], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    a.download = `${getBaseFilename()}-metadata.csv`;
    a.click();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-20 relative z-10">
      
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 rounded-lg border bg-amber-500/10 border-amber-500/20 text-amber-400">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Video Stock Engine</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
            Sistem produksi video animasi 4K. Mendukung <span className="text-zinc-300 font-bold">Three.js, PixiJS, & p5.js</span>. Pilih parameter untuk <span className="text-amber-400 font-bold">Auto-Generate (Pro)</span>.
          </p>
        </div>
        <div className="flex flex-col md:items-end bg-black/20 border border-white/5 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Command className="w-3 h-3"/> Active Quota
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${tokenBalance > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="font-mono font-bold text-xl text-zinc-200">{tokenBalance} <span className="text-xs font-sans text-zinc-500">Tokens</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
         
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-white/[0.01] border border-amber-500/20 rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><Zap size={100}/></div>
             
             <div className="flex items-center justify-between mb-4 relative z-10">
               <label className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> AI Code Generator</label>
               <button 
                  onClick={handleMagicIdea}
                  disabled={!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-xs font-bold transition-all active:scale-95 shadow-sm disabled:opacity-50"
               >
                 {isMagicLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                 {isMagicLoading ? "Berpikir..." : "Magic Stock Idea"}
               </button>
             </div>
             
             <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
                <select value={engine} onChange={(e) => setEngine(e.target.value)} disabled={isGeneratingCode || isPreviewing || isMagicLoading} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-2 text-[11px] font-bold text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-colors">
                  <option value="" disabled className="bg-[#0a0a0a] text-zinc-500">Pilih Engine...</option>
                  <option value="threejs" className="bg-[#0a0a0a] text-zinc-300">Three.js (3D)</option>
                  <option value="pixijs" className="bg-[#0a0a0a] text-zinc-300">PixiJS (2D)</option>
                  <option value="p5js" className="bg-[#0a0a0a] text-zinc-300">p5.js (2D/Art)</option>
                </select>

                <select value={style} onChange={(e) => setStyle(e.target.value)} disabled={isGeneratingCode || isPreviewing || isMagicLoading} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-2 text-[11px] font-bold text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-colors">
                  <option value="" disabled className="bg-[#0a0a0a] text-zinc-500">Pilih Style...</option>
                  <option value="abstract" className="bg-[#0a0a0a] text-zinc-300">Abstract</option>
                  <option value="neon" className="bg-[#0a0a0a] text-zinc-300">Neon/Cyber</option>
                  <option value="minimalist" className="bg-[#0a0a0a] text-zinc-300">Minimalist</option>
                  <option value="realistic" className="bg-[#0a0a0a] text-zinc-300">Realistic</option>
                </select>

                <select value={shape} onChange={(e) => setShape(e.target.value)} disabled={isGeneratingCode || isPreviewing || isMagicLoading} className="w-full bg-black/40 border border-white/5 rounded-lg px-2 py-2 text-[11px] font-bold text-zinc-300 focus:outline-none focus:border-amber-500/50 transition-colors">
                  <option value="" disabled className="bg-[#0a0a0a] text-zinc-500">Pilih Shape...</option>
                  <option value="geometric" className="bg-[#0a0a0a] text-zinc-300">Geometric</option>
                  <option value="particles" className="bg-[#0a0a0a] text-zinc-300">Particles</option>
                  <option value="fluid" className="bg-[#0a0a0a] text-zinc-300">Fluid/Liquid</option>
                  <option value="lines" className="bg-[#0a0a0a] text-zinc-300">Lines/Waves</option>
                </select>
             </div>

             <textarea 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading}
                placeholder={isSelectionComplete ? "Ketik prompt di sini atau gunakan Magic Stock Idea..." : "⚠️ Silakan pilih Engine, Style, dan Shape terlebih dahulu..."}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm font-medium text-white placeholder-zinc-600 resize-none h-28 focus:outline-none focus:border-amber-500/50 transition-all custom-scrollbar relative z-10"
              />
              <button 
                onClick={handleGenerateCode}
                disabled={!isSelectionComplete || isGeneratingCode || !aiPrompt || isPreviewing || isMagicLoading}
                className="w-full mt-4 bg-amber-500 text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-lg hover:bg-amber-400 active:scale-[0.98] relative z-10"
              >
                {isGeneratingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                {isGeneratingCode ? "Writing Animation & Metadata..." : "Generate Code & SEO (1 Token)"}
              </button>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Logic & Output Engine</h2>
              </div>
              <button onClick={() => setCode("")} className="text-zinc-500 hover:text-rose-400 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
            
            <textarea 
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Tempel kode PixiJS, Three.js, atau p5.js secara manual atau generate di atas..."
              className="w-full h-[200px] bg-black/40 border border-white/5 rounded-xl px-4 py-4 text-xs font-mono text-emerald-400 placeholder-zinc-700 resize-none focus:outline-none focus:border-white/20 transition-all custom-scrollbar"
            />
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Maximize2 size={12}/> Target Resolution
                </label>
                <select 
                   className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-300 focus:outline-none"
                   value={`${resolution.w}x${resolution.h}`}
                   onChange={(e) => {
                     const [w, h] = e.target.value.split('x').map(Number);
                     setResolution({ w, h });
                     if (w === 3840 || h === 3840) {
                      setRenderScale(1);
                     }
                  }}
                >
                  <option value="3840x2160" className="bg-[#0a0a0a] text-emerald-400">4K (Optimal Adobe)</option>
                  <option value="1920x1080" className="bg-[#0a0a0a] text-zinc-300">FHD (1080p)</option>
                  <option value="1080x1920" className="bg-[#0a0a0a] text-zinc-300">Vertical (TikTok)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Layers size={12}/> Render Scale (Upscaler)
                </label>
                <select 
                   className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-300 focus:outline-none"
                   value={renderScale}
                   onChange={(e) => setRenderScale(Number(e.target.value))}
                >
                  <option value={1} className="bg-[#0a0a0a] text-emerald-400">1x (Native/Stabil)</option>
                  {!is4K && <option value={2} className="bg-[#0a0a0a] text-amber-400">2x (Menjadi 4K)</option>}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12}/> Export Bitrate
                </label>
                <select className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-zinc-300 focus:outline-none" value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
                  <option value={30} className="bg-[#0a0a0a] text-zinc-300">30 Mbps (Optimal FHD)</option>
                  <option value={50} className="bg-[#0a0a0a] text-amber-400">50 Mbps (Optimal 4K)</option>
                  <option value={80} className="bg-[#0a0a0a] text-purple-400">80 Mbps (High Quality)</option>
                  <option value={120} className="bg-[#0a0a0a] text-emerald-400">120 Mbps (RTX 3060 Power)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={12}/> Duration (Sec)
                </label>
                <input type="number" value={recordDuration} onChange={(e) => setRecordDuration(Number(e.target.value))} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500/30" />
              </div>
            </div>

            <button
              onClick={isPreviewing ? handleStopPreview : handleRunPreview}
              disabled={!code || isRecording}
              className={`w-full mt-6 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                isPreviewing ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-zinc-100 text-black hover:bg-white shadow-lg'
              }`}
            >
              {isPreviewing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isPreviewing ? "Terminate Engine" : "Inject & Run Preview"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-zinc-400" />
                <h2 className="text-sm font-bold text-white">Production Canvas</h2>
              </div>
              {isPreviewing && (
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    Live Rendering ({renderScale}x Scale)
                  </span>
                </div>
              )}
            </div>
            
            <div className="w-full aspect-video bg-black/60 rounded-2xl border border-white/5 relative overflow-hidden flex items-center justify-center group shadow-inner">
              {isPreviewing ? (
                <iframe ref={iframeRef} srcDoc={generatePreviewDoc(code, resolution, renderScale)} style={{ width: '100%', height: '100%', border: 'none' }} title="Canvas Preview" />
              ) : (
                <div className="text-center px-8">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                    <Monitor className="w-8 h-8 text-zinc-700" />
                  </div>
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest leading-relaxed">Preview akan muncul di sini <br /> setelah Anda menyuntikkan kode</p>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 left-4 bg-rose-500 px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-xl">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Recording Media...</span>
                </div>
              )}
            </div>

            <div className="mt-6"> 
              <button 
                onClick={startRecording}
                disabled={!isPreviewing || isRecording}
                className="w-full bg-zinc-100 text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 disabled:opacity-30 transition-all hover:bg-white active:scale-[0.98]"
              >
                {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                {isRecording ? `Encoding Video... (Wait ${recordDuration}s)` : `Start Recording & Export (${bitrate} Mbps)`}
              </button>
            </div>
          </div>

          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none"><FileText size={100}/></div>
             
             <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4 relative z-10">
               <div className="flex items-center gap-2.5">
                 <FileText className="w-4 h-4 text-[#0048FF]" />
                 <h2 className="text-sm font-bold text-white">Adobe Stock Metadata</h2>
               </div>
             </div>
             
             <div className="space-y-4 relative z-10">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                   Title
                   <span className={`${title.length > 200 ? 'text-rose-500' : 'text-zinc-500'}`}>{title.length}/200</span>
                 </label>
                 {/* Input sekarang bisa diisi manual bebas tanpa batas, bisa diubah kapanpun */}
                 <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="A short description of what the asset represents" className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#0048FF]/50 transition-colors" />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                   Keywords
                   <span className={`${keywords.split(',').length > 49 ? 'text-rose-500' : 'text-zinc-500'}`}>{keywords ? keywords.split(',').filter(k => k.trim() !== '').length : 0}/49</span>
                 </label>
                 <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="keyword1, keyword2, keyword3..." className="w-full h-20 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none focus:border-[#0048FF]/50 transition-colors custom-scrollbar" />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Category</label>
                 <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-sm font-bold text-zinc-300 focus:outline-none focus:border-[#0048FF]/50">
                   {ADOBE_CATEGORIES.map(cat => (
                     <option key={cat.id} value={cat.id.toString()} className="bg-[#0a0a0a] text-zinc-300">{cat.name}</option>
                   ))}
                 </select>
               </div>

               <button onClick={downloadCSV} className="w-full bg-[#0048FF] text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-3 transition-all hover:bg-[#003FE0] shadow-lg shadow-[#0048FF]/20 active:scale-[0.98] mt-2">
                 <Download className="w-4 h-4" /> Export CSV (Adobe Stock Format)
               </button>
               
               <div className="text-center pt-2">
                 {lastRecordedFilename ? (
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Linked File: <span className="text-emerald-400 lowercase">{lastRecordedFilename}</span></p>
                 ) : (
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">File akan terhubung: <span className="text-amber-400 lowercase">{getBaseFilename()}.{currentExtension}</span></p>
                 )}
               </div>
             </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex text-left gap-3 text-rose-400 text-xs font-bold leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-12 h-12 bg-rose-500/10 rounded-xl border border-rose-500/20 flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Insufficient Quota</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
                Anda tidak memiliki cukup Token untuk melakukan Auto-Generate.
              </p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-white/5 border border-white/10 text-white font-bold text-sm py-3 rounded-lg hover:bg-white/10 transition-colors">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}