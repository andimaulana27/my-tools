"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  Command,
  Download,
  FileText,
  Layers,
  Loader2,
  Maximize2,
  Monitor,
  Play,
  Settings2,
  Sparkles,
  Square,
  Video,
  Wand2,
  Zap,
} from "lucide-react";
import { generateMagicVideoIdeaFromGemini, generateVideoCodeWithToken, getVideoPromptHistoryCount, recordVideoSpecUse } from "../actions/video";
import {
  ADOBE_RESOLUTIONS,
  CAMERAS,
  MATERIALS,
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  PALETTES,
  VIDEO_ENGINES,
  VIDEO_SHAPES,
  VIDEO_STYLES,
  clampDuration,
  fingerprintLabel,
  isValidEngine,
  preferredTemplate,
  uniquenessKey,
} from "@/lib/video-engine/catalog";
import { buildAdobeStockCsv, stockCsvFilename, stockVideoFilename } from "@/lib/video-engine/adobe-csv";
import { buildPreviewDocument } from "@/lib/video-engine/iframe";
import {
  ensureUniqueSpec,
  readUniquenessMemory,
  rememberGeneratedSpec,
  rerollDistinct,
  resolveSpec,
} from "@/lib/video-engine/uniqueness";
import type { VideoSpec } from "@/lib/video-engine/types";
import { PageHeading, QuotaMeta } from "@/components/ui/PageHeading";

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
  { id: 19, name: "Technology" }, { id: 20, name: "Transport" }, { id: 21, name: "Travel" },
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
  const [spec, setSpec] = useState<VideoSpec | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCanvasReady, setIsCanvasReady] = useState(false);
  const [recordDuration, setRecordDuration] = useState(10);
  const [resolution, setResolution] = useState({ w: 3840, h: 2160 });
  const [fps, setFps] = useState(30);
  const [bitrate, setBitrate] = useState(50);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [category, setCategory] = useState("8");
  const [lastRecordedFilename, setLastRecordedFilename] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [infoNote, setInfoNote] = useState<string | null>(null);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const [genAiMarked, setGenAiMarked] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const exportMetaRef = useRef({
    videoFilename: "microstock-video-3840x2160.mp4",
    title: "",
    keywords: "",
    category: "8",
  });

  const isSelectionComplete = engine !== "" && style !== "" && shape !== "";
  const previewDoc = useMemo(() => {
    if (!spec) return "";
    return buildPreviewDocument(resolveSpec(spec, resolution, fps));
  }, [spec, resolution, fps]);

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
        const history = await getVideoPromptHistoryCount(authData.user.id);
        if (history.success) setHistoryCount(history.count);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string; message?: string };
      if (data?.type === "stock-ready") setIsCanvasReady(true);
      if (data?.type === "error" && data.message) {
        setError(data.message);
        setIsCanvasReady(false);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const currentVideoFilename = lastRecordedFilename || stockVideoFilename(title, resolution.w, resolution.h);
  const currentCsvFilename = stockCsvFilename(currentVideoFilename);

  const handleMagicIdea = async () => {
    if (!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading) return;
    setIsMagicLoading(true);
    try {
      const memory = readUniquenessMemory();
      const res = await generateMagicVideoIdeaFromGemini(engine, style, shape, memory.prompts, userId);
      if (res.success && res.idea) {
        setRecordDuration(clampDuration(res.idea.duration || 10));
        setAiPrompt(res.idea.prompt || "");
      } else {
        setAiPrompt(`Seamless looping ${style} ${shape} with premium studio lighting and distinct PBR materials`);
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
    setInfoNote(null);
    setIsPreviewing(false);
    setIsCanvasReady(false);

    const memory = readUniquenessMemory();
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("prompt", aiPrompt);
    formData.append("engine", engine);
    formData.append("style", style);
    formData.append("shape", shape);
    formData.append("duration", clampDuration(recordDuration).toString());
    formData.append("usedKeys", JSON.stringify(memory.keys));

    const result = await generateVideoCodeWithToken(formData);

    if (result.success && "spec" in result && result.spec) {
      setSpec(result.spec);
      rememberGeneratedSpec(result.spec, aiPrompt);
      if (result.title) setTitle(result.title);
      if (result.keywords) setKeywords(result.keywords);
      if (result.category) setCategory(result.category);
      if (result.note) setInfoNote(result.note);
      if ("historyCount" in result && typeof result.historyCount === "number") {
        setHistoryCount(result.historyCount);
      }
      if (result.newTokenBalance !== undefined) {
        setTokenBalance(result.newTokenBalance);
        window.dispatchEvent(new CustomEvent("tokenBalanceUpdated", { detail: { newTokenBalance: result.newTokenBalance } }));
      }
    } else {
      if (result.error === "INSUFFICIENT_TOKENS") setShowTokenAlert(true);
      else setError(result.error || "Gagal menghasilkan spec unik. Generate ulang.");
    }
    setIsGeneratingCode(false);
  };

  const handleLoadSample = () => {
    if (!isSelectionComplete || isPreviewing || isRecording || !isValidEngine(engine)) return;
    const memory = readUniquenessMemory();
    const palette = PALETTES[(Math.abs(Date.now()) + memory.keys.length) % PALETTES.length];
    const unique = ensureUniqueSpec(
      {
        engine,
        style,
        shape,
        template: preferredTemplate(engine, shape),
        material: style === "luxury" ? "gold-luxury" : style === "neon" ? "neon-emissive" : style === "organic" ? "velvet" : "italian-marble",
        palette: palette.id,
        camera: "orbit-hero",
        seed: Math.floor(Math.random() * 1_000_000_000) || 1,
        duration: clampDuration(recordDuration),
        prompt: aiPrompt || `Sample ${style} ${shape}`,
      },
      memory.keys
    );
    setSpec(unique.spec);
    setInfoNote("Sample spec (0 token) untuk cek kualitas runtime. Generate Unique Spec tetap diperlukan untuk judul/keyword Adobe.");
    setError(null);
  };

  const handleReroll = () => {
    if (!spec || isPreviewing || isRecording) return;
    const memory = readUniquenessMemory();
    const next = rerollDistinct(spec, memory.keys);
    setSpec(next.spec);
    rememberGeneratedSpec(next.spec, spec.prompt);
    setInfoNote(next.note);
    if (!userId) return;
    void recordVideoSpecUse({
      userId,
      prompt: next.spec.prompt,
      engine: next.spec.engine,
      style: next.spec.style,
      shape: next.spec.shape,
      template: next.spec.template,
      material: next.spec.material,
      palette: next.spec.palette,
      camera: next.spec.camera,
      uniquenessKey: uniquenessKey(next.spec),
      title,
    }).then((res) => {
      if (res.success && typeof res.historyCount === "number") setHistoryCount(res.historyCount);
    });
  };

  const handleRunPreview = () => {
    if (!spec) return;
    const duration = clampDuration(recordDuration);
    setRecordDuration(duration);
    setSpec({ ...spec, duration });
    setError(null);
    setIsCanvasReady(false);
    setIsPreviewing(true);
  };

  const handleStopPreview = () => {
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setIsPreviewing(false);
    setIsRecording(false);
    setIsCanvasReady(false);
  };

  const waitFrames = (count: number) =>
    new Promise<void>((resolve) => {
      const step = (left: number) => {
        if (left <= 0) resolve();
        else requestAnimationFrame(() => step(left - 1));
      };
      step(count);
    });

  const startRecording = async () => {
    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow as (Window & { StockRuntime?: { resetClock: () => void } }) | null;
    const canvas = iframeRef.current.contentDocument?.querySelector("canvas");
    if (!canvas || !win?.StockRuntime) {
      setError("Canvas belum siap. Jalankan preview sampai status Live Rendering muncul.");
      return;
    }

    try {
      const codecsToTry = [
        "video/mp4;codecs=avc1.640034",
        "video/mp4;codecs=avc1.4D4028",
        "video/mp4;codecs=avc1",
        "video/mp4",
      ];
      const selectedMimeType = codecsToTry.find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || "";
      if (!selectedMimeType) {
        setError("Browser ini tidak bisa encode MP4/H.264. Pakai Chrome atau Edge terbaru. WebM ditolak Adobe Stock.");
        return;
      }

      const duration = clampDuration(spec?.duration || recordDuration);
      const videoFilename = stockVideoFilename(title, resolution.w, resolution.h);
      exportMetaRef.current = {
        videoFilename,
        title,
        keywords,
        category,
      };
      setLastRecordedFilename(videoFilename);
      setIsRecording(true);
      setError(null);

      const { saveAs } = await import("file-saver");
      saveAs(
        buildAdobeStockCsv(videoFilename, title, keywords, category),
        stockCsvFilename(videoFilename)
      );

      win.StockRuntime.resetClock();
      await waitFrames(2);

      const stream = (canvas as CustomHTMLCanvasElement).captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType,
        videoBitsPerSecond: bitrate * 1000000,
      });

      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onerror = (event: Event & { error?: Error }) => {
        setError(`Perekaman terhenti: ${event.error?.message || "GPU/encoder overload. Turunkan ke HD 30fps."}`);
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType });
        if (blob.size === 0) {
          setError("Gagal merender video (0 byte). Turunkan resolusi atau FPS, lalu coba lagi.");
        } else {
          void downloadAdobePair(blob, exportMetaRef.current);
        }
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = recorder;
      recorder.start(250);
      window.setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
      }, duration * 1000);
    } catch (err: unknown) {
      console.error(err);
      setError("Sistem mengalami kesalahan saat inisialisasi MP4 encoder.");
      setIsRecording(false);
    }
  };

  const downloadAdobePair = async (videoBlob: Blob, meta: { videoFilename: string; title: string; keywords: string; category: string }) => {
    try {
      const csvBlob = buildAdobeStockCsv(meta.videoFilename, meta.title, meta.keywords, meta.category);
      const csvName = stockCsvFilename(meta.videoFilename);
      const { saveAs } = await import("file-saver");
      saveAs(videoBlob, meta.videoFilename);
      window.setTimeout(() => saveAs(csvBlob, csvName), 400);
      setInfoNote(`Terunduh: ${meta.videoFilename} dan ${csvName}. Kolom Filename di CSV sama persis dengan nama MP4, jadi Adobe Stock langsung mencocokkan metadata.`);
    } catch (err) {
      console.error(err);
      setError("Video ter-encode, tapi gagal mengunduh CSV. Gunakan tombol CSV di bawah.");
    }
  };

  const downloadCSV = async () => {
    const videoFilename = lastRecordedFilename || stockVideoFilename(title, resolution.w, resolution.h);
    const { saveAs } = await import("file-saver");
    saveAs(buildAdobeStockCsv(videoFilename, title, keywords, category), stockCsvFilename(videoFilename));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <PageHeading
        stamp="Engine"
        title="Video stock."
        lede="Three.js r170 PBR, PixiJS, dan p5.js. Native 4K, loop seamless, uniqueness gate, CSV Adobe Stock."
        meta={
          <div>
            <QuotaMeta value={tokenBalance} />
            <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-text-faint">
              History {historyCount}
            </p>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-bg border border-line p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={14} /> Unique Spec Generator
              </label>
              <button
                onClick={handleMagicIdea}
                disabled={!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading}
                className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-hover hover:border-text hover:bg-text hover:text-bg disabled:opacity-50"
              >
                {isMagicLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {isMagicLoading ? "Berpikir..." : "Magic Stock Idea"}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 relative z-10">
              <select value={engine} onChange={(e) => setEngine(e.target.value)} disabled={isGeneratingCode || isPreviewing || isMagicLoading} className="w-full bg-bg-elevated border border-line px-2 py-2 text-[11px] font-bold text-text focus:outline-none focus:border-text">
                <option value="" disabled className="bg-bg text-text-muted">Pilih Engine...</option>
                {VIDEO_ENGINES.map((item) => (
                  <option key={item.id} value={item.id} className="bg-bg text-text">{item.label}</option>
                ))}
              </select>
              <select value={style} onChange={(e) => setStyle(e.target.value)} disabled={isGeneratingCode || isPreviewing || isMagicLoading} className="w-full bg-bg-elevated border border-line px-2 py-2 text-[11px] font-bold text-text focus:outline-none focus:border-text">
                <option value="" disabled className="bg-bg text-text-muted">Pilih Style...</option>
                {VIDEO_STYLES.map((item) => (
                  <option key={item.id} value={item.id} className="bg-bg text-text">{item.label}</option>
                ))}
              </select>
              <select value={shape} onChange={(e) => setShape(e.target.value)} disabled={isGeneratingCode || isPreviewing || isMagicLoading} className="w-full bg-bg-elevated border border-line px-2 py-2 text-[11px] font-bold text-text focus:outline-none focus:border-text">
                <option value="" disabled className="bg-bg text-text-muted">Pilih Shape...</option>
                {VIDEO_SHAPES.map((item) => (
                  <option key={item.id} value={item.id} className="bg-bg text-text">{item.label}</option>
                ))}
              </select>
            </div>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              disabled={!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading}
              placeholder={isSelectionComplete ? "Ketik konsep komersial, atau Magic Stock Idea..." : "Pilih Engine, Style, dan Shape dulu..."}
              className="w-full bg-bg-elevated border border-line px-4 py-3 text-sm font-medium text-text placeholder:text-text-faint resize-none h-28 focus:outline-none focus:border-text custom-scrollbar relative z-10"
            />
            <button
              onClick={handleGenerateCode}
              disabled={!isSelectionComplete || isGeneratingCode || !aiPrompt || isPreviewing || isMagicLoading}
              className="btn-primary relative z-10 mt-4 w-full"
            >
              {isGeneratingCode ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              {isGeneratingCode ? "Locking unique spec & SEO..." : "Generate Unique Spec (1 Token)"}
            </button>
            <button
              onClick={handleLoadSample}
              disabled={!isSelectionComplete || isGeneratingCode || isPreviewing || isMagicLoading}
              className="btn-ghost mt-2 h-10 w-full text-xs disabled:opacity-40"
            >
              Load sample spec (0 token)
            </button>
          </div>

          <div className="bg-bg border border-line p-6">
            <div className="flex items-center justify-between mb-5 border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-text-muted" />
                <h2 className="text-sm font-bold text-text uppercase tracking-widest">Locked Runtime Spec</h2>
              </div>
              <button onClick={handleReroll} disabled={!spec || isPreviewing || isRecording} className="text-[10px] font-bold uppercase tracking-widest text-accent disabled:text-text-faint">
                Reroll unique
              </button>
            </div>

            {spec ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <SpecChip label="Template" value={spec.template} />
                  <SpecChip label="Material" value={MATERIALS.find((item) => item.id === spec.material)?.label || spec.material} />
                  <SpecChip label="Palette" value={PALETTES.find((item) => item.id === spec.palette)?.label || spec.palette} />
                  <SpecChip label="Camera" value={CAMERAS.find((item) => item.id === spec.camera)?.label || spec.camera} />
                </div>
                <p className="text-[10px] font-mono text-accent break-all">ID {fingerprintLabel(spec)}</p>
                <p className="text-[10px] text-text-muted">Key uniqueness: {uniquenessKey(spec)}</p>
              </div>
            ) : (
              <p className="text-xs text-text-faint">Spec muncul setelah generate. Runtime yang merender, bukan kode Gemini acak.</p>
            )}

            <div className="grid grid-cols-2 gap-4 mt-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Maximize2 size={12} /> Native Resolution
                </label>
                <select
                  className="w-full bg-bg-elevated border border-line px-3 py-2 text-xs font-bold text-text focus:outline-none"
                  value={`${resolution.w}x${resolution.h}`}
                  disabled={isPreviewing}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split("x").map(Number);
                    setResolution({ w, h });
                    if (w >= 2160 || h >= 2160) setFps(30);
                  }}
                >
                  {ADOBE_RESOLUTIONS.map((item) => (
                    <option key={`${item.w}x${item.h}`} value={`${item.w}x${item.h}`} className="bg-bg text-text">
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} /> Frame Rate
                </label>
                <select className="w-full bg-bg-elevated border border-line px-3 py-2 text-xs font-bold text-text focus:outline-none" value={fps} disabled={isPreviewing} onChange={(e) => setFps(Number(e.target.value))}>
                  <option value={30} className="bg-bg text-accent">30 fps (aman 4K Adobe)</option>
                  <option value={60} className="bg-bg text-accent">60 fps (HD / GPU kuat)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} /> Export Bitrate
                </label>
                <select className="w-full bg-bg-elevated border border-line px-3 py-2 text-xs font-bold text-text focus:outline-none" value={bitrate} onChange={(e) => setBitrate(Number(e.target.value))}>
                  <option value={30} className="bg-bg text-text">30 Mbps (HD)</option>
                  <option value={50} className="bg-bg text-accent">50 Mbps (4K recommended)</option>
                  <option value={80} className="bg-bg text-accent">80 Mbps (high)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                  <Settings2 size={12} /> Duration 5–60s
                </label>
                <input
                  type="number"
                  min={MIN_DURATION_SEC}
                  max={MAX_DURATION_SEC}
                  value={recordDuration}
                  disabled={isPreviewing}
                  onChange={(e) => setRecordDuration(Number(e.target.value))}
                  onBlur={() => {
                    const next = clampDuration(recordDuration);
                    setRecordDuration(next);
                    if (spec) setSpec({ ...spec, duration: next });
                  }}
                  className="w-full bg-bg-elevated border border-line px-3 py-2 text-xs font-mono text-text focus:outline-none focus:border-text"
                />
              </div>
            </div>

            <button
              onClick={isPreviewing ? handleStopPreview : handleRunPreview}
              disabled={!spec || isRecording}
              className={isPreviewing ? "btn-ghost mt-6 w-full" : "btn-primary mt-6 w-full"}
            >
              {isPreviewing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              {isPreviewing ? "Terminate Engine" : "Inject & Run Preview"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-bg border border-line p-6 flex flex-col">
            <div className="flex items-center justify-between mb-5 border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <Monitor className="w-4 h-4 text-text-muted" />
                <h2 className="text-sm font-bold text-text">Production Canvas</h2>
              </div>
              {isPreviewing && (
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 ${isCanvasReady ? "bg-accent animate-pulse" : "bg-accent"}`} />
                  <span className={`text-[10px] font-medium uppercase tracking-widest ${isCanvasReady ? "text-accent" : "text-text-faint"}`}>
                    {isCanvasReady ? `Live ${resolution.w}x${resolution.h} @ ${fps}fps` : "Booting runtime..."}
                  </span>
                </div>
              )}
            </div>

            <div className="w-full aspect-video bg-bg/80 border border-line relative overflow-hidden flex items-center justify-center group">
              {isPreviewing && spec ? (
                <iframe ref={iframeRef} srcDoc={previewDoc} style={{ width: "100%", height: "100%", border: "none" }} title="Canvas Preview" />
              ) : (
                <div className="text-center px-8">
                  <div className="w-16 h-16 bg-wash flex items-center justify-center mx-auto mb-4 border border-line">
                    <Monitor className="w-8 h-8 text-text-faint" />
                  </div>
                  <p className="text-xs font-bold text-text-faint uppercase tracking-widest leading-relaxed">Preview runtime PBR muncul di sini</p>
                </div>
              )}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-accent px-3 py-1.5">
                  <div className="h-2 w-2 bg-btn-bg" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-btn-bg">Recording MP4 loop...</span>
                </div>
              )}
            </div>

            <button
              onClick={startRecording}
              disabled={!isPreviewing || !isCanvasReady || isRecording}
              className="btn-primary mt-6 w-full disabled:opacity-30"
            >
              {isRecording ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              {isRecording ? `Encoding MP4 + CSV... (${clampDuration(spec?.duration || recordDuration)}s)` : `Export MP4 + CSV Adobe (${bitrate} Mbps)`}
            </button>
            <p className="mt-3 text-[10px] text-text-muted text-center leading-relaxed">
              CSV diunduh saat tombol ditekan, MP4 menyusul setelah encode. Nama file sama: <span className="text-text lowercase">{currentVideoFilename}</span> / <span className="text-text lowercase">{currentCsvFilename}</span>
            </p>
          </div>

          <div className="bg-bg border border-line p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-5 border-b border-line pb-4 relative z-10">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-accent" />
                <h2 className="text-sm font-bold text-text">Adobe Stock Metadata</h2>
              </div>
            </div>
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                  Title
                  <span className={`${title.length > 200 ? "text-accent" : "text-text-muted"}`}>{title.length}/200</span>
                </label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} placeholder="A short description of what the asset represents" className="w-full bg-bg-elevated border border-line px-3 py-2 text-sm text-text focus:outline-none focus:border-text" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center justify-between">
                  Keywords
                  <span className={`${keywords.split(",").filter((k) => k.trim()).length > 49 ? "text-accent" : "text-text-muted"}`}>
                    {keywords ? keywords.split(",").filter((k) => k.trim()).length : 0}/49
                  </span>
                </label>
                <textarea value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="keyword1, keyword2, keyword3..." className="w-full h-20 bg-bg-elevated border border-line px-3 py-2 text-sm text-text resize-none focus:outline-none focus:border-text custom-scrollbar" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-bg-elevated border border-line px-3 py-2 text-sm font-bold text-text focus:outline-none focus:border-text">
                  {ADOBE_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id.toString()} className="bg-bg text-text">{cat.name}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-start gap-3 text-xs text-text-muted leading-relaxed bg-wash border border-line p-3">
                <input type="checkbox" checked={genAiMarked} onChange={(e) => setGenAiMarked(e.target.checked)} className="mt-0.5" />
                Saat upload di Contributor Portal, centang <span className="text-text font-semibold">Created using generative AI</span>. CSV Adobe tidak punya kolom ini.
              </label>
              <button onClick={downloadCSV} className="btn-primary w-full">
                <Download className="w-4 h-4" /> Unduh ulang CSV ({currentCsvFilename})
              </button>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest text-center leading-relaxed">
                Adobe pair: <span className="text-accent lowercase">{currentVideoFilename}</span>
                {" + "}
                <span className="text-accent lowercase">{currentCsvFilename}</span>
              </p>
            </div>
          </div>

          {infoNote && (
            <div className="bg-wash border border-line p-4 text-text text-xs font-bold leading-relaxed">
              {infoNote}
            </div>
          )}
          {error && (
            <div className="bg-wash border border-line p-4 flex text-left gap-3 text-accent text-xs font-bold leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" /> <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-bg border border-line w-full max-w-sm p-8 text-center">
              <div className="w-12 h-12 bg-wash border border-line flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Insufficient Quota</h3>
              <p className="text-text-muted text-sm mb-6 leading-relaxed">Anda tidak memiliki cukup Token untuk generate spec unik.</p>
              <button onClick={() => setShowTokenAlert(false)} className="btn-ghost w-full">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elevated border border-line px-3 py-2">
      <p className="text-[9px] uppercase tracking-widest text-text-muted mb-1">{label}</p>
      <p className="text-text font-bold truncate">{value}</p>
    </div>
  );
}
