// src/app/(user)/youtube-seo/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MonitorPlay, 
  Sparkles, 
  Play, 
  Loader2, 
  Copy, 
  Check, 
  Settings2, 
  Plus, 
  Trash2, 
  Gamepad2, 
  Layout, 
  Hash, 
  AlertCircle,
  X,
  Save,
  TextSelect
} from "lucide-react";
import { 
  generateYouTubeSEO, 
  getYouTubeTemplates, 
  saveYouTubeTemplate, 
  deleteYouTubeTemplate 
} from "../actions/youtube";

type SEOResult = {
  title: string;
  description: string;
  tags: string;
};

type Template = {
  id: string;
  template_name: string;
  title_format: string;
  description_format: string;
};

export default function YouTubeSEOPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  // State Form Utama
  const [gameName, setGameName] = useState("");
  const [platform, setPlatform] = useState("PC");
  const [vibe, setVibe] = useState("Nostalgia, Santai, Interaktif");
  const [currentProgress, setCurrentProgress] = useState(""); // State Baru Untuk Memori
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");

  // State Data
  const [templates, setTemplates] = useState<Template[]>([]);
  const [result, setResult] = useState<SEOResult | null>(null);
  
  // UI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmittingTemplate, setIsSubmittingTemplate] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTokenAlert, setShowTokenAlert] = useState(false);

  // Form Template Baru
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    titleStyle: "",
    descStyle: ""
  });

  useEffect(() => {
    async function loadInitialData() {
      const { data: authData } = await supabase.auth.getUser();
      if (authData.user) {
        setUserId(authData.user.id);
        
        // Load Profile & Token
        const { data: profile } = await supabase
          .from("profiles")
          .select("token_balance")
          .eq("id", authData.user.id)
          .single();
        if (profile) setTokenBalance(profile.token_balance);

        // Load Templates
        const res = await getYouTubeTemplates(authData.user.id);
        if (res.success && res.templates) setTemplates(res.templates);
      }
    }
    loadInitialData();
  }, []);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setIsSubmittingTemplate(true);

    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("templateName", newTemplate.name);
    formData.append("titleFormat", newTemplate.titleStyle);
    formData.append("descriptionFormat", newTemplate.descStyle);

    const res = await saveYouTubeTemplate(formData);
    if (res.success && res.template) {
      setTemplates([res.template, ...templates]);
      setIsModalOpen(false);
      setNewTemplate({ name: "", titleStyle: "", descStyle: "" });
    }
    setIsSubmittingTemplate(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!userId || !confirm("Hapus template ini?")) return;
    const res = await deleteYouTubeTemplate(id, userId);
    if (res.success) {
      setTemplates(templates.filter(t => t.id !== id));
      if (selectedTemplate === id) setSelectedTemplate("none");
    }
  };

  const handleGenerate = async () => {
    if (!userId || !gameName) return;
    if (tokenBalance < 1) {
      setShowTokenAlert(true);
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("gameName", gameName);
    formData.append("platform", platform);
    formData.append("vibe", vibe);
    formData.append("currentProgress", currentProgress); // Kirim memory progress

    if (selectedTemplate !== "none") {
      const t = templates.find(temp => temp.id === selectedTemplate);
      if (t) {
        formData.append("templateData", `Style Judul: ${t.title_format}\nStyle Deskripsi: ${t.description_format}`);
      }
    }

    const res = await generateYouTubeSEO(formData);
    if (res.success && res.metadata) {
      setResult(res.metadata);
      setTokenBalance(res.newTokenBalance ?? tokenBalance);
      window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
        detail: { newTokenBalance: res.newTokenBalance } 
      }));
    } else {
      alert(res.error || "Gagal generate SEO");
    }
    setIsGenerating(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-20 relative z-10">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 rounded-lg border bg-red-500/10 border-red-500/20 text-red-400">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">YouTube SEO Engine</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
            Optimasi otomatis Judul, Deskripsi, dan Tag untuk Live Stream. Fokus pada performa pencarian game <span className="text-zinc-300 font-bold">Retro & AAA</span> dengan Fitur Continuity.
          </p>
        </div>
        <div className="flex flex-col items-end bg-black/20 border border-white/5 p-4 rounded-xl shrink-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
             Quota Tersedia
          </span>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${tokenBalance > 0 ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
            <span className="font-mono font-bold text-xl text-zinc-200">{tokenBalance} <span className="text-xs font-sans text-zinc-500">Tokens</span></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: INPUT & TEMPLATE */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Stream Info</h2>
               </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nama Game</label>
                <input 
                  type="text" 
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  placeholder="Contoh: Harvest Moon Back to Nature"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* FITUR BARU: CONTINUITY PROGRESS */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 flex items-center gap-1.5 uppercase tracking-widest">
                  <TextSelect className="w-3 h-3 text-red-400" /> Cerita / Target Momen di Live Ini
                </label>
                <textarea 
                  value={currentProgress}
                  onChange={(e) => setCurrentProgress(e.target.value)}
                  placeholder="Misal: Siap berhadapan dengan Jack Krauser hari ini..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Platform</label>
                  <select 
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 appearance-none"
                  >
                    <option value="PC">PC</option>
                    <option value="PlayStation 1">PS1</option>
                    <option value="PlayStation 2">PS2</option>
                    <option value="Retro Console">Retro Other</option>
                    <option value="Next-Gen">PS5 / AAA</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Vibe Stream</label>
                  <input 
                    type="text" 
                    value={vibe}
                    onChange={(e) => setVibe(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5 pt-4 border-t border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gunakan Template Gaya</label>
                  <button onClick={() => setIsModalOpen(true)} className="text-[10px] font-bold text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
                    <Plus className="w-3 h-3" /> Buat Baru
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                   <button 
                    onClick={() => setSelectedTemplate("none")}
                    className={`px-4 py-3 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center ${selectedTemplate === "none" ? "bg-white/10 border-white/20 text-white" : "bg-black/20 border-white/5 text-zinc-500"}`}
                   >
                     <span>Standar AI Engine</span>
                     {selectedTemplate === "none" && <Check className="w-3 h-3" />}
                   </button>
                   {templates.map(t => (
                     <div key={t.id} className="group relative">
                        <button 
                          onClick={() => setSelectedTemplate(t.id)}
                          className={`w-full px-4 py-3 rounded-xl text-xs font-bold border transition-all text-left flex justify-between items-center ${selectedTemplate === t.id ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-black/20 border-white/5 text-zinc-500 hover:border-white/10"}`}
                        >
                          <span className="truncate pr-6">{t.template_name}</span>
                          {selectedTemplate === t.id && <Check className="w-3 h-3" />}
                        </button>
                        <button 
                          onClick={() => handleDeleteTemplate(t.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-700 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                     </div>
                   ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !gameName}
                className="w-full bg-zinc-100 text-black py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isGenerating ? "Menganalisis SEO..." : "Generate Live SEO (1 Token)"}
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: HASIL */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !isGenerating ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <MonitorPlay className="w-8 h-8 text-zinc-700" />
               </div>
               <h3 className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-xs">Awaiting Command</h3>
               <p className="text-zinc-600 text-sm mt-2 max-w-xs">Isi data game dan target ceritanya di samping untuk menghasilkan metadata SEO berkesinambungan.</p>
            </div>
          ) : isGenerating ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 animate-spin text-red-500/50 mb-6" />
              <h3 className="text-zinc-200 font-bold uppercase tracking-[0.2em] text-xs">Synthesizing Metadata</h3>
              <p className="text-zinc-500 text-sm mt-2">Gemini sedang merangkai kata kunci dan menarik memori cerita game dari database...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Judul Result */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Layout className="w-3 h-3" /> Live Title
                  </div>
                  <button 
                    onClick={() => handleCopy(result!.title, 'title')}
                    className="flex items-center gap-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {copiedField === 'title' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'title' ? 'Copied' : 'Copy Judul'}
                  </button>
                </div>
                <p className="text-lg font-bold text-white leading-tight">{result!.title}</p>
              </div>

              {/* Deskripsi Result */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Gamepad2 className="w-3 h-3" /> Stream Description
                  </div>
                  <button 
                    onClick={() => handleCopy(result!.description, 'desc')}
                    className="flex items-center gap-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {copiedField === 'desc' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'desc' ? 'Copied' : 'Copy Deskripsi'}
                  </button>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap font-medium">
                    {result!.description}
                  </p>
                </div>
              </div>

              {/* Tags Result */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <Hash className="w-3 h-3" /> Search Tags (CSV)
                  </div>
                  <button 
                    onClick={() => handleCopy(result!.tags, 'tags')}
                    className="flex items-center gap-2 text-[10px] font-bold text-red-400 hover:text-red-300 transition-colors"
                  >
                    {copiedField === 'tags' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedField === 'tags' ? 'Copied' : 'Copy Tags'}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 font-mono bg-black/40 border border-white/5 p-4 rounded-xl leading-loose">
                  {result!.tags}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH TEMPLATE */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-red-400" /> Simpan Gaya Bahasa
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white p-1 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               <form onSubmit={handleSaveTemplate} className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nama Template</label>
                    <input 
                      type="text" required
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                      placeholder="Contoh: Gaya Santai Retro"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contoh Gaya Judul</label>
                    <textarea 
                      required
                      value={newTemplate.titleStyle}
                      onChange={(e) => setNewTemplate({...newTemplate, titleStyle: e.target.value})}
                      placeholder="Contoh: MAIN LAGI! [NAMA GAME] PS1 - Nostalgia Parah"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 h-20 resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Contoh Gaya Deskripsi</label>
                    <textarea 
                      required
                      value={newTemplate.descStyle}
                      onChange={(e) => setNewTemplate({...newTemplate, descStyle: e.target.value})}
                      placeholder="Tuliskan gaya sapaan atau info stream khas Anda..."
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 h-28 resize-none"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={isSubmittingTemplate}
                    className="w-full bg-zinc-100 text-black font-bold py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-white active:scale-95 transition-all"
                  >
                    {isSubmittingTemplate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Template
                  </button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERT TOKEN */}
      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-3xl p-8 text-center">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Token Habis</h3>
              <p className="text-zinc-500 text-sm mb-6">Quota harian Anda sudah habis. Tunggu reset otomatis jam 12 siang.</p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/10 transition-colors">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}