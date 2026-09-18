/* eslint-disable @next/next/no-img-element */
// src/app/(user)/image-engine/page.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { generateImageWithToken } from "../actions/image";
import { PageHeading, QuotaMeta } from "@/components/ui/PageHeading";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Palette, Settings2, Play, AlertCircle, Loader2, Image as ImageIcon, 
  Sparkles, Download, X, Maximize2, UploadCloud, LayoutGrid, Square, 
  Archive, AlertTriangle, Layers, CheckCircle2, ChevronDown, Command, Camera, PenTool, Focus, Calendar, Hash
} from "lucide-react";

export enum DesignStyle {
  DUOTONE_OFFSET_LINE_ART = "Duotone Offset Line Art",
  FLAT_LAYERED_SCENERY = "Flat Layered Scenery",
  KAWAII_THICK_OUTLINE = "Kawaii Thick Outline Sticker",
  CORPORATE_MEMPHIS_FLAT = "Corporate Memphis Flat",
  GRID_SPOT_COLOR_ICONS = "Grid Spot Color Icons",
  FLAT_PASTEL_ELEMENTS = "Flat Pastel Elements",
  MONOLINE_SPOT_BADGE = "Monoline Spot Badge",
  CONTINUOUS_ONE_LINE = "Continuous One Line Botanical",
  ABSTRACT_BOHO_GEOMETRIC = "Abstract Boho Geometric",
  
  ISOMETRIC_3D_CLAY = "3D Isometric Clay",
  FLAT_VECTOR_NO_OUTLINE = "Flat Vector No Outline",
  DETAILED_COMIC_OUTLINE = "Detailed Comic Outline",
  SOLID_BLACK_SILHOUETTE = "Solid Black Silhouette",
  WATERCOLOR_ISOLATED = "Watercolor Isolated",
  VINTAGE_RETRO_ENGRAVING = "Vintage Retro Engraving",
  LOW_POLY_3D = "Low Poly 3D",

  // NEW STYLES: HANDDRAWN & HALFTONE
  HANDDRAWN_MINIMALIST_DOODLE = "Handdrawn Minimalist Doodle",
  RETRO_HALFTONE_POP_ART = "Retro Halftone Pop-Art"
}

const STYLE_DESCRIPTIONS: Record<DesignStyle, string> = {
  [DesignStyle.DUOTONE_OFFSET_LINE_ART]: "Rekomendasi: Ikon bisnis, UI, objek tunggal. Garis luar hitam bersih dengan warna aksen yang digeser (offset). Sangat mudah di-tracing otomatis.",
  [DesignStyle.FLAT_LAYERED_SCENERY]: "Rekomendasi: Latar alam, langit, pegunungan. Mengandalkan tumpukan bentuk geometris/organik tanpa garis luar untuk efek kedalaman.",
  [DesignStyle.KAWAII_THICK_OUTLINE]: "Rekomendasi: Stiker lucu, makanan, furnitur imut. Karakter dengan wajah, garis luar hitam tebal, warna solid vibrant, dan dekorasi sparkles.",
  [DesignStyle.CORPORATE_MEMPHIS_FLAT]: "Rekomendasi: Ilustrasi website bisnis, HRD. Karakter flat tanpa outline, proporsi dinamis, dengan 2 warna kontras tinggi.",
  [DesignStyle.GRID_SPOT_COLOR_ICONS]: "Rekomendasi: Paket ikon UI, medis, uang. Ikon garis sangat presisi dalam grid, didominasi warna gelap dengan HANYA satu warna aksen (spot color).",
  [DesignStyle.FLAT_PASTEL_ELEMENTS]: "Rekomendasi: Aset musim panas, pantai, kosmetik. Flat vector tanpa outline menggunakan palet warna pastel yang lembut.",
  [DesignStyle.MONOLINE_SPOT_BADGE]: "Rekomendasi: Logo, eco-friendly, alam. Menggunakan 1 ketebalan garis (monoline) dengan background blok warna organik/noda air.",
  [DesignStyle.CONTINUOUS_ONE_LINE]: "Rekomendasi: Daun, bunga, wajah estetik. Seni dari satu tarikan garis menyambung dengan blok warna pastel/earth-tone di belakangnya. Sangat premium.",
  [DesignStyle.ABSTRACT_BOHO_GEOMETRIC]: "Rekomendasi: Wall art poster, background minimalis. Komposisi lengkungan (arch), matahari/bulan, dengan palet warna earth-tone (krem, terakota, sage).",
  
  [DesignStyle.ISOMETRIC_3D_CLAY]: "Rekomendasi: Ikon teknologi, edukasi, web modern. Objek 3D dengan sudut isometrik, pencahayaan matte/clay yang lembut, dan warna pastel bersih.",
  [DesignStyle.FLAT_VECTOR_NO_OUTLINE]: "Rekomendasi: Ilustrasi modern, editorial, UI/UX. Vektor detail tanpa garis tepi hitam, shading menggunakan blok warna solid yang tegas.",
  [DesignStyle.DETAILED_COMIC_OUTLINE]: "Rekomendasi: Karakter, aksi, pop-art. Garis luar hitam yang sangat tebal dan dinamis, dipadukan dengan warna vibrant dan shading titik halftone.",
  [DesignStyle.SOLID_BLACK_SILHOUETTE]: "Rekomendasi: File potong Cricut/Silhouette, stensil, ikon simpel. Blok warna hitam murni 100% tanpa ada detail lubang atau warna di dalamnya.",
  [DesignStyle.WATERCOLOR_ISOLATED]: "Rekomendasi: Bunga pernikahan, elemen estetik. Gaya sapuan cat air yang fluid dan transparan, namun terisolasi rapi pada background putih.",
  [DesignStyle.VINTAGE_RETRO_ENGRAVING]: "Rekomendasi: Desain kopi, label klasik, ilustrasi monokrom. Gaya ukiran stempel kayu retro dengan garis arsiran (cross-hatching) mendetail.",
  [DesignStyle.LOW_POLY_3D]: "Rekomendasi: Background abstrak, elemen tekno/crypto. Seni geometris 3D yang dibentuk dari faset-faset bersudut tajam dengan bayangan jelas.",

  [DesignStyle.HANDDRAWN_MINIMALIST_DOODLE]: "Rekomendasi: Elemen peta, jurnal, infografis organik. Gaya coretan tangan (doodle) yang kasual, tidak sempurna, dengan garis yang bervariasi.",
  [DesignStyle.RETRO_HALFTONE_POP_ART]: "Rekomendasi: Jalan retro, elemen komik, stiker vintage. Penggunaan tekstur titik-titik halftone untuk shading, garis tegas, dan warna pop-art yang mencolok."
};

export enum RealisticTheme {
  COMPUTER_SCIENCE = "Computer Science & Software Engineering",
  SCIENCE_LAB = "Scientific Research & Laboratory",
  CREATIVE_DESIGN = "Creative Design & Digital Artist Workspace",
  TECHNOLOGY = "Technology & Future",
  CRYPTO = "Cryptocurrency & Blockchain",
  DIGITAL_MARKETING = "Digital Marketing & SEO",
  HEALTHCARE = "Healthcare & Medicine",
  LAW = "Law & Justice",
  BUSINESS = "Corporate Business & Finance",
  EDUCATION = "Education & E-Learning",
  ENVIRONMENT = "Nature & Eco Sustainability",
  CYBERSECURITY = "Cybersecurity & Hacking",
  LIFESTYLE = "Modern Lifestyle & Authentic People",
  AI_ROBOTICS = "AI & Machine Learning",
  REAL_ESTATE = "Real Estate & Architecture",
  FOOD = "Gourmet Food & Culinary",
  DIVERSITY_TEAMWORK = "Diversity & Corporate Teamwork",
  INDUSTRIAL_LOGISTICS = "Industrial, Factory & Logistics",
  WELLNESS_BEAUTY = "Health, Wellness & Beauty"
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
  eventContext: string;
  title: string;
  timestamp: number;
}

const BATCH_SIZE = 2; 
const INTER_BATCH_DELAY_MS = 2000;

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const MONTHLY_EVENTS: Record<number, { name: string, date: string }[]> = {
  0: [
    { name: "New Year's Day", date: "1 Jan" }, { name: "Orthodox Christmas", date: "7 Jan" }, 
    { name: "Martin Luther King Jr. Day", date: "15 Jan (Bervariasi)" }, { name: "Australia Day", date: "26 Jan" }, 
    { name: "Lunar New Year / Imlek", date: "Akhir Jan / Awal Feb" }, { name: "Winter Sports / Ski Season", date: "Sepanjang Bulan" }
  ],
  1: [
    { name: "Groundhog Day", date: "2 Feb" }, { name: "Super Bowl Sunday", date: "Minggu Ke-2" }, 
    { name: "Valentine's Day", date: "14 Feb" }, { name: "President's Day", date: "Senin Ke-3" }, 
    { name: "Mardi Gras / Carnival", date: "Pertengahan Feb" }, { name: "Black History Month", date: "Sepanjang Bulan" }
  ],
  2: [
    { name: "World Wildlife Day", date: "3 Mar" }, { name: "International Women's Day", date: "8 Mar" }, 
    { name: "St. Patrick's Day", date: "17 Mar" }, { name: "Spring Season Begins / Vernal Equinox", date: "20 Mar" }, 
    { name: "Earth Hour", date: "Sabtu Terakhir" }, { name: "Ramadan Begins", date: "Bervariasi" }
  ],
  3: [
    { name: "April Fools' Day", date: "1 Apr" }, { name: "World Health Day", date: "7 Apr" }, 
    { name: "Easter / Paskah", date: "Awal/Pertengahan Apr" }, { name: "Tax Day (US)", date: "15 Apr" }, 
    { name: "Earth Day", date: "22 Apr" }, { name: "Eid al-Fitr / Lebaran", date: "Bervariasi" }
  ],
  4: [
    { name: "May Day / Labor Day (Global)", date: "1 Mei" }, { name: "Star Wars Day (May the 4th)", date: "4 Mei" }, 
    { name: "Cinco de Mayo", date: "5 Mei" }, { name: "Mother's Day", date: "Minggu Ke-2" }, 
    { name: "Memorial Day (US)", date: "Senin Terakhir" }, { name: "Mental Health Awareness Month", date: "Sepanjang Bulan" }
  ],
  5: [
    { name: "World Environment Day", date: "5 Jun" }, { name: "Juneteenth", date: "19 Jun" }, 
    { name: "Father's Day", date: "Minggu Ke-3" }, { name: "Summer Solstice / First Day of Summer", date: "21 Jun" }, 
    { name: "Pride Month", date: "Sepanjang Bulan" }, { name: "Summer Travel & Vacations", date: "Sepanjang Bulan" }
  ],
  6: [
    { name: "Canada Day", date: "1 Jul" }, { name: "Independence Day (US)", date: "4 Jul" }, 
    { name: "World Emoji Day", date: "17 Jul" }, { name: "International Friendship Day", date: "30 Jul" }, 
    { name: "Back to School Preparation", date: "Akhir Bulan" }
  ],
  7: [
    { name: "International Youth Day", date: "12 Ags" }, { name: "World Photography Day", date: "19 Ags" }, 
    { name: "Women's Equality Day", date: "26 Ags" }, { name: "Back to School Season", date: "Sepanjang Bulan" }, 
    { name: "Summer Sales & Clearance", date: "Akhir Bulan" }
  ],
  8: [
    { name: "Labor Day (US)", date: "Senin Pertama" }, { name: "Grandparents Day", date: "Minggu Ke-2" }, 
    { name: "Oktoberfest Begins", date: "Pertengahan Sep" }, { name: "Autumn Equinox / First Day of Fall", date: "22 Sep" }, 
    { name: "World Tourism Day", date: "27 Sep" }
  ],
  9: [
    { name: "World Mental Health Day", date: "10 Okt" }, { name: "Canadian Thanksgiving", date: "Senin Ke-2" }, 
    { name: "World Food Day", date: "16 Okt" }, { name: "Halloween", date: "31 Okt" }, 
    { name: "Breast Cancer Awareness Month", date: "Sepanjang Bulan" }
  ],
  10: [
    { name: "Dia de los Muertos (Day of the Dead)", date: "1-2 Nov" }, { name: "Diwali", date: "Awal/Pertengahan Nov" }, 
    { name: "Veterans Day / Remembrance Day", date: "11 Nov" }, { name: "Thanksgiving (US)", date: "Kamis Ke-4" }, 
    { name: "Black Friday", date: "Jumat Ke-4" }, { name: "Cyber Monday", date: "Senin Setelah BF" }
  ],
  11: [
    { name: "Hanukkah", date: "Pertengahan Des" }, { name: "Winter Solstice / First Day of Winter", date: "21 Des" }, 
    { name: "Christmas Eve", date: "24 Des" }, { name: "Christmas Day", date: "25 Des" }, 
    { name: "Boxing Day", date: "26 Des" }, { name: "New Year's Eve", date: "31 Des" }
  ]
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function ImageEnginePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  const [prompt, setPrompt] = useState("");
  const [imageType, setImageType] = useState<"vector" | "realistic">("vector"); 
  const [style, setStyle] = useState<DesignStyle>(DesignStyle.HANDDRAWN_MINIMALIST_DOODLE);
  const [theme, setTheme] = useState<RealisticTheme>(RealisticTheme.COMPUTER_SCIENCE);
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [seasonalEvent, setSeasonalEvent] = useState<string>(""); 
  
  const [ratio, setRatio] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [outputMode, setOutputMode] = useState<"single" | "set">("single");
  const [totalImages, setTotalImages] = useState<number>(1); 
  
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  const isCancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonthEvents = useMemo(() => {
    return MONTHLY_EVENTS[selectedMonth] || [];
  }, [selectedMonth]);

  useEffect(() => {
    setSeasonalEvent("");
  }, [selectedMonth]);

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

  const handleGenerate = useCallback(async () => {
    if (!prompt || !userId) return;

    if (tokenBalance < totalImages) {
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

    const generateOne = async (index: number) => {
        if (isCancelledRef.current) return;

        try {
            const formData = new FormData();
            formData.append("userId", userId);
            formData.append("prompt", prompt.trim());
            formData.append("ratio", ratio);
            formData.append("imageType", imageType); 
            formData.append("outputMode", outputMode);
            formData.append("seasonalEvent", seasonalEvent); 

            if (imageType === "vector") {
                formData.append("style", style);
                if (referenceImage) formData.append("referenceImage", referenceImage);
            } else {
                formData.append("theme", theme);
            }

            const result = await generateImageWithToken(formData);

            if (result.success && result.imageUrl) {
              const newImage: GeneratedImage = {
                  id: crypto.randomUUID(),
                  url: result.imageUrl,
                  prompt: prompt,
                  style: imageType === 'vector' ? style : theme,
                  eventContext: seasonalEvent || "General Concept",
                  title: `GENERATION ${index + 1}`,
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
            console.error(`Failed to generate image ${index + 1}`, err);
            setError("Gagal memproses beberapa gambar. Pastikan kuota cukup atau coba lagi.");
        } finally {
            completedCount++;
            setProgress(completedCount);
        }
    };

    const tasks = Array.from({ length: totalImages }, (_, i) => i);
    
    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
        if (isCancelledRef.current) break;
        const batch = tasks.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(idx => generateOne(idx)));
        
        if (i + BATCH_SIZE < tasks.length && !isCancelledRef.current) {
          await sleep(INTER_BATCH_DELAY_MS);
        }
    }

    if (completedCount > 0) {
      setPromptHistory(prev => Array.from(new Set([...prev, prompt.trim().toLowerCase()])));
    }

    setIsGenerating(false);
  }, [prompt, style, theme, ratio, outputMode, imageType, totalImages, referenceImage, userId, tokenBalance, seasonalEvent]);

  const handleDownloadAllZip = async () => {
    if (images.length === 0) return;
    setIsDownloadingZip(true);
    
    try {
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      const zip = new JSZip();

      const convertToPng = (base64Url: string): Promise<Blob> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = base64Url;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            
            // PERBAIKAN: Gunakan resolusi murni asli Imagen, tanpa resize palsu
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
               ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
               canvas.toBlob((blob) => {
                 if (blob) resolve(blob);
                 else reject(new Error("Blob conversion failed"));
               }, 'image/png', 1.0); 
            } else {
               reject(new Error("Canvas context failed"));
            }
          };
          img.onerror = () => reject(new Error("Image loaded failed"));
        });
      };

      for (let i = 0; i < images.length; i++) {
         const blob = await convertToPng(images[i].url);
         zip.file(`mytools-asset-${images[i].id.substring(0,8)}.png`, blob);
      }

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `mytools-batch-${Date.now()}.zip`);
    } catch (err) {
      console.error("Gagal membuat file ZIP", err);
      alert("Terjadi kesalahan saat mengunduh ZIP. Pastikan internet stabil.");
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const progressPercent = Math.min((progress / totalImages) * 100, 100);
  const isSimilar = promptHistory.includes(prompt.trim().toLowerCase());

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
      
      <PageHeading
        stamp="Engine"
        title="Asset generator."
        lede="Batch Imagen: vector, realistic, dan kalender perencanaan aset."
        meta={<QuotaMeta value={tokenBalance} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: KONFIGURASI LENGKAP */}
        <div className="lg:col-span-4 bg-bg border border-line p-6 relative overflow-hidden flex flex-col h-fit">
          <div className="flex items-center justify-between border-b border-line pb-4 mb-5 shrink-0">
            <div className="flex items-center gap-2.5">
              <Settings2 className="w-4 h-4 text-text-muted" />
              <h2 className="text-sm font-bold text-text uppercase tracking-widest">Design Rules</h2>
            </div>
            <span className="text-[9px] font-bold bg-wash text-text-muted px-2.5 py-1 uppercase tracking-widest border border-line">
              Batch Mode
            </span>
          </div>

          <div className="space-y-6">

            {/* EVENT & SEASONAL CALENDAR */}
            <div className="space-y-3 bg-bg p-4 border border-line">
              <label className="text-[10px] font-bold text-accent uppercase tracking-widest flex items-center gap-2">
                <Calendar size={14}/> Stock Market Calendar
              </label>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    disabled={isGenerating}
                    className="w-full appearance-none bg-bg/90 border border-line text-text text-[11px] font-medium px-3 py-2.5 pr-8 focus:outline-none focus:border-text"
                  >
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx} className="bg-bg text-text">{m}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-text-muted">
                    <ChevronDown size={14} />
                  </div>
                </div>

                <div className="relative col-span-2 mt-1">
                  <select
                    value={seasonalEvent}
                    onChange={(e) => setSeasonalEvent(e.target.value)}
                    disabled={isGenerating}
                    className="w-full appearance-none bg-bg/90 border border-line text-text text-[11px] font-medium px-3 py-2.5 pr-8 focus:outline-none focus:border-text"
                  >
                    <option value="" className="bg-bg text-text-muted">-- Bebas (General Event) --</option>
                    {currentMonthEvents.map((ev) => (
                      <option key={ev.name} value={ev.name} className="bg-bg text-text">
                        {ev.name} ({ev.date})
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-text-faint">
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>
              <p className="text-[9px] text-text-muted leading-relaxed mt-1">Pilih bulan target untuk mempersiapkan aset event besar dunia lebih awal.</p>
            </div>
            
            {/* IMAGE TYPE TOGGLE */}
            <div className="space-y-3 pt-4 border-t border-line">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Camera size={14}/> Jenis Gambar Utama
              </label>
              <div className="flex bg-wash border border-line p-1">
                <button
                  onClick={() => setImageType('vector')}
                  disabled={isGenerating}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all ${ imageType === 'vector' ? 'bg-btn-bg text-btn-fg ' : 'text-text-muted hover:text-text' }`}
                >
                  <PenTool size={14} /> Vector Art
                </button>
                <button
                  onClick={() => setImageType('realistic')}
                  disabled={isGenerating}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold transition-all ${ imageType === 'realistic' ? 'bg-btn-bg text-btn-fg ' : 'text-text-muted hover:text-text' }`}
                >
                  <Camera size={14} /> Realistic Photo
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-line">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid size={14}/> Mode Hasil Output
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOutputMode('single')}
                  disabled={isGenerating || imageType === 'realistic'} 
                  className={`px-3 py-2.5 text-[11px] font-bold transition-all border text-center flex flex-col items-center justify-center gap-1.5 ${ outputMode === 'single' ? 'bg-btn-bg text-btn-fg border-text ' : 'bg-wash text-text-muted border-line hover:border-text hover:text-text' } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <Square size={16} /> Satuan (Single)
                </button>
                <button
                  onClick={() => setOutputMode('set')}
                  disabled={isGenerating || imageType === 'realistic'}
                  className={`px-3 py-2.5 text-[11px] font-bold transition-all border text-center flex flex-col items-center justify-center gap-1.5 ${ outputMode === 'set' ? 'bg-btn-bg text-btn-fg border-text ' : 'bg-wash text-text-muted border-line hover:border-text hover:text-text' } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  <LayoutGrid size={16} /> Set (Berbaris)
                </button>
              </div>
            </div>

            {imageType === 'vector' ? (
              <>
                <div className="space-y-3 pt-4 border-t border-line">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2"><Palette size={14}/> Vector Art Style</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(DesignStyle).map((ds) => (
                        <button
                          key={ds}
                          onClick={() => setStyle(ds)}
                          disabled={isGenerating}
                          className={`flex-grow text-center px-3 py-2 text-[10px] font-bold transition-all border relative group/stylebtn ${ style === ds ? 'bg-btn-bg text-btn-fg border-text ' : 'bg-wash text-text-muted border-line hover:border-text hover:text-text' }`}
                        >
                          {ds}
                          {/* 💡 Popup Hover Informasi / Rekomendasi Style */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-bg text-text text-[10px] font-medium border border-line opacity-0 pointer-events-none group-hover/stylebtn:opacity-100 transition-opacity z-50 text-left leading-normal whitespace-normal">
                            <span className="text-accent font-bold block mb-1">💡 Info & Rekomendasi:</span>
                            {STYLE_DESCRIPTIONS[ds]}
                          </div>
                        </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-line">
                   <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2"><ImageIcon size={14}/> Reference DNA (Optional)</label>
                   <div 
                      onClick={() => !isGenerating && fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={(e)=>e.preventDefault()}
                      className={`relative w-full h-28 border border-dashed transition-all flex flex-col items-center justify-center cursor-pointer ${ isGenerating ? 'opacity-50 cursor-not-allowed' : 'hover:bg-wash' } ${referenceImage ? 'border-line bg-bg-elevated' : 'border-line bg-wash'}`}
                    >
                      {referenceImage ? (
                        <>
                          <img src={referenceImage} alt="Reference" className="w-full h-full object-cover opacity-80" />
                          <button onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }} className="absolute -top-2 -right-2 z-20 border border-line bg-bg p-1.5 text-text transition-colors duration-hover hover:border-text hover:bg-text hover:text-bg">
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <div className="w-8 h-8 bg-wash flex items-center justify-center mx-auto mb-2"><UploadCloud size={14} className="text-text-muted" /></div>
                          <div className="text-[10px] font-bold text-text-muted uppercase">Upload Reference</div>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && processFile(e.target.files[0])} disabled={isGenerating} />
                   </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3 pt-4 border-t border-line">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2"><Focus size={14}/> Realistic Photo Themes</label>
                  <p className="text-xs text-text-muted mb-2">Pilih niche market untuk foto realistik Anda.</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(RealisticTheme).map((rt) => (
                        <button
                          key={rt}
                          onClick={() => setTheme(rt)}
                          disabled={isGenerating}
                          className={`flex-grow text-center px-3 py-2 text-[10px] font-bold transition-all border ${ theme === rt ? 'bg-btn-bg text-btn-fg border-text ' : 'bg-wash text-text-muted border-line hover:border-text hover:text-text' }`}
                        >
                          {rt}
                        </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <div className="space-y-3 pt-4 border-t border-line">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2"><Maximize2 size={14}/> Aspect Ratio</label>
              <div className="grid grid-cols-4 gap-2">
                {Object.values(AspectRatio).map((r) => (
                  <button
                    key={r} onClick={() => setRatio(r)} disabled={isGenerating}
                    className={`px-2 py-2 text-[11px] font-mono font-bold transition-all border text-center ${ ratio === r ? 'bg-btn-bg text-btn-fg border-text ' : 'bg-wash text-text-muted border-line hover:border-text hover:text-text' }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-line">
              <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <Hash size={14}/> Jumlah Output (Batch)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num} onClick={() => setTotalImages(num)} disabled={isGenerating}
                    className={`flex-1 py-2 text-[11px] font-medium transition-colors duration-hover border text-center ${ totalImages === num ? 'bg-btn-bg text-btn-fg border-text' : 'bg-wash text-text-muted border-line hover:border-text hover:text-text' }`}
                  >
                    {num} Gambar
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* KOLOM KANAN: WORKSPACE & GALLERY */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-bg border border-line p-6 flex flex-col relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none"><Layers size={100}/></div>
             
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
                <div className="flex items-center gap-4">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> Master Prompt Instruksi</label>
                </div>
             </div>

             <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isGenerating}
                placeholder={imageType === 'vector' ? "Masukkan prompt instruksi detail Anda di sini. Teks ini akan dikirim murni langsung ke Imagen..." : "Masukkan prompt adegan fotografi Anda di sini. Teks ini akan dikirim murni langsung ke Imagen..."}
                className={`w-full bg-bg-elevated border px-4 py-3 text-sm font-medium text-text resize-none h-28 focus:outline-none transition-all custom-scrollbar relative z-10 ${ isSimilar ? "border-line focus:border-text placeholder:text-text-faint" : "border-line focus:border-text placeholder:text-text-faint" }`}
              />
              
              <div className="mt-2 flex items-center justify-between">
                <div className={`px-3 py-2.5 border flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium w-max ${ !prompt ? 'bg-wash border-line text-text-muted' : isSimilar ? 'border-accent text-accent' : 'border-line text-text' }`}>
                    {
                      !prompt ? <><AlertCircle size={14}/> Menunggu Input...</> :
                      isSimilar ? <><AlertTriangle size={14}/> Prompt Duplikat</> : 
                      <><CheckCircle2 size={14}/> Prompt Tersedia (Unik)</>
                    }
                 </div>
                 <span className="text-xs text-accent font-medium flex items-center gap-1">
                    <Command size={12}/> Prompt Langsung ke Imagen (Direct)
                 </span>
              </div>

              <div className="mt-5 flex flex-col space-y-4">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                  className="btn-primary w-full disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                    {isGenerating ? `Rendering Imagen Batch... (${progress}/${totalImages})` : `Generate Asset Batch (${totalImages} Image)`}
                  </span>
                </button>

                {isGenerating && (
                  <div className="w-full h-1.5 bg-bg-elevated border border-line overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} className="h-full bg-btn-bg relative">
                      <div className="absolute inset-0 bg-wash w-full h-full animate-pulse" />
                    </motion.div>
                  </div>
                )}
              </div>
          </div>

          {error && (
             <div className="bg-wash border border-line p-4 flex items-center gap-3 text-accent text-xs font-bold">
               <AlertCircle size={16} /> {error}
             </div>
          )}

          <div className="bg-bg border border-line p-6 min-h-[400px]">
            <div className="flex items-center justify-between mb-5 border-b border-line pb-4">
              <h2 className="text-sm font-bold text-text flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-text-muted" />
                Asset Collection Gallery
              </h2>
              
              {images.length > 0 && (
                <button 
                  onClick={handleDownloadAllZip}
                  disabled={isGenerating || isDownloadingZip}
                  className="btn-ghost h-9 px-3 text-[11px] uppercase tracking-[0.16em]"
                >
                  {isDownloadingZip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  Download (.ZIP)
                </button>
              )}
            </div>

            {images.length === 0 && !isGenerating ? (
               <div className="h-[250px] flex flex-col items-center justify-center text-center">
                 <div className="p-4 bg-wash mb-3 border border-line"><Layers size={24} className="text-text-faint" /></div>
                 <p className="text-[11px] font-mono uppercase tracking-widest text-text-muted">System Idle - Awaiting Input</p>
               </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                <AnimatePresence>
                  {images.map((img, idx) => (
                    <motion.div
                      key={img.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => setSelectedImage(img)}
                      className="group relative aspect-square bg-bg-elevated border border-line overflow-hidden cursor-pointer transition-all hover:border-text hover:z-10"
                    >
                      <img src={img.url} alt={img.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-bg/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <Maximize2 size={20} className="text-text" />
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-bg/90 border border-line text-[9px] font-mono text-text uppercase font-bold">
                        {img.title}
                      </div>
                    </motion.div>
                  ))}
                  {isGenerating && images.length < totalImages && (
                     <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="aspect-square bg-bg-elevated border border-dashed border-line flex flex-col items-center justify-center">
                       <Loader2 size={20} className="text-text-muted animate-spin mb-3" />
                       <span className="text-[9px] text-text-muted font-bold uppercase tracking-widest text-center px-4">
                         Rendering Layout...
                       </span>
                     </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ALERT TOKEN HABIS */}
      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bg/90">
            <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: 10 }} className="bg-bg border border-line w-full max-w-sm p-8 text-center">
              <div className="w-12 h-12 bg-wash border border-line flex items-center justify-center mx-auto mb-5">
                <AlertCircle className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Insufficient Quota</h3>
              <p className="text-text-muted text-sm mb-6 leading-relaxed">
                Anda tidak memiliki cukup Studio Credits. <br/> Sisa: <span className="text-accent font-bold">{tokenBalance} Tokens</span>. Batch memerlukan {totalImages} token.
              </p>
              <button onClick={() => setShowTokenAlert(false)} className="btn-ghost w-full">
                Dismiss
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* LIGHTBOX MODAL */}
      <AnimatePresence>
        {selectedImage && (
          <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function ImageModal({ image, onClose }: { image: GeneratedImage, onClose: () => void }) {
  const handleDownload = (format: 'png' | 'jpg') => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image.url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      
      const link = document.createElement('a');
      link.href = canvas.toDataURL(mimeType, format === 'jpg' ? 0.95 : 1.0);
      link.download = `mytools-asset-${image.id}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/90 p-4">
      <motion.button onClick={onClose} className="absolute top-6 right-6 z-50 border border-line p-2 text-text-muted transition-colors duration-hover hover:border-text hover:bg-text hover:text-bg">
        <X size={20} />
      </motion.button>

      <motion.div initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-bg border border-line overflow-hidden max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row">
        <div className="flex-[1.5] bg-bg-elevated flex items-center justify-center p-8 relative min-h-[300px] border-b md:border-b-0 md:border-r border-line">
          <div className="absolute inset-0 bg-[radial-gradient(var(--line)_1px,transparent_1px)] [background-size:20px_20px]" />
          <img src={image.url} alt="Detail" className="max-w-full max-h-[70vh] object-contain relative z-10 border border-line" />
        </div>
        
        <div className="w-full md:w-[350px] p-8 flex flex-col overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1 block">Asset View</span>
              <h3 className="text-lg font-bold text-text uppercase tracking-tight">{image.title}</h3>
            </div>
            
            <div className="space-y-5 flex-1">
                <div className="p-4 bg-wash border border-line">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-2 font-bold">Base Prompt</label>
                    <p className="text-text text-xs font-medium leading-relaxed">&quot;{image.prompt}&quot;</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-wash border border-line">
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1">Style / Theme</label>
                    <p className="text-text text-[11px] font-bold uppercase truncate">{image.style}</p>
                  </div>
                  <div className="p-3 bg-wash border border-line" title={image.eventContext}>
                    <label className="text-[10px] text-text-muted uppercase tracking-widest block mb-1">Event / Season</label>
                    <p className="text-text text-[11px] font-bold uppercase truncate">{image.eventContext}</p>
                  </div>
                </div>
            </div>

            <div className="mt-8 space-y-2.5">
                <button onClick={() => handleDownload('png')} className="btn-primary w-full">
                   <Download size={16} /> Download Murni PNG
                </button>
                <button onClick={() => handleDownload('jpg')} className="btn-ghost w-full">
                   <Download size={14} /> Standard JPEG
                </button>
            </div>
        </div>
      </motion.div>
    </div>
  );
}