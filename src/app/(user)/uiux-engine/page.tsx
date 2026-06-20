// src/app/(user)/uiux-engine/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutTemplate, 
  Play, 
  Loader2, 
  Copy, 
  Check, 
  Settings2, 
  AlertCircle,
  Component,
  MessageSquare,
  Globe,
  Building2,
  Users
} from "lucide-react";
import { generateUIUXCopy } from "../actions/uiux";

type ContentSuggestion = {
  element: string;
  copy: string;
};

type UXSection = {
  sectionName: string;
  purpose: string;
  uiComponents: string[];
  contentSuggestions: ContentSuggestion[];
};

type UXPage = {
  pageName: string;
  sections: UXSection[];
};

type UXResult = {
  projectTheme: string;
  suggestedCompanyName: string;
  targetAudience: string;
  pages: UXPage[];
};

export default function UIUXEnginePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  // State Form
  const [theme, setTheme] = useState("");
  const [tone, setTone] = useState("Profesional, Jelas, dan Terpercaya");
  const [pageScope, setPageScope] = useState("landing_page_only");

  // State Data & UI
  const [result, setResult] = useState<UXResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showTokenAlert, setShowTokenAlert] = useState(false);

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
      }
    }
    loadInitialData();
  }, []);

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    let fullText = `Project: ${result.projectTheme}\nBrand: ${result.suggestedCompanyName}\nAudience: ${result.targetAudience}\n\n`;
    
    result.pages.forEach(page => {
      fullText += `=== PAGE: ${page.pageName.toUpperCase()} ===\n`;
      page.sections.forEach(sec => {
        fullText += `\n[ ${sec.sectionName.toUpperCase()} ]\n`;
        fullText += `Purpose: ${sec.purpose}\n`;
        fullText += `UI Components: ${sec.uiComponents.join(', ')}\n`;
        fullText += `Copywriting:\n`;
        sec.contentSuggestions.forEach(copy => {
          fullText += `- ${copy.element}: "${copy.copy}"\n`;
        });
      });
      fullText += `\n`;
    });
    
    handleCopy(fullText, 'all');
  };

  const handleGenerate = async () => {
    if (!userId || !theme) return;
    if (tokenBalance < 1) {
      setShowTokenAlert(true);
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("theme", theme);
    formData.append("tone", tone);
    formData.append("pageScope", pageScope);

    const res = await generateUIUXCopy(formData);
    if (res.success && res.uxData) {
      setResult(res.uxData);
      setTokenBalance(res.newTokenBalance ?? tokenBalance);
      window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
        detail: { newTokenBalance: res.newTokenBalance } 
      }));
    } else {
      alert(res.error || "Gagal merancang UI/UX");
    }
    setIsGenerating(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-20 relative z-10">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 rounded-lg border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
              <LayoutTemplate className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">UI/UX Copy & Layout Engine</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
            Hasilkan kerangka halaman, rekomendasi komponen UI, dan <span className="text-zinc-300 font-bold">Copywriting siap pakai</span> untuk mempercepat proses desain di Figma atau Frontend.
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
        
        {/* KOLOM KIRI: INPUT FORM */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Project Brief</h2>
               </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tema Industri / Niche</label>
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Contoh: Klinik Gigi, Firma Hukum, SaaS Akuntansi"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tone of Voice (Gaya Bahasa)</label>
                <input 
                  type="text" 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Contoh: Ramah, Mewah, atau Enerjik"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cakupan Desain</label>
                <select 
                  value={pageScope}
                  onChange={(e) => setPageScope(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 appearance-none"
                >
                  <option value="landing_page_only">Landing Page Utama Saja (Header - Footer)</option>
                  <option value="multi_page">Full Website (Multi-page)</option>
                </select>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !theme}
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isGenerating ? "Merancang UI & Copy..." : "Generate UX Wireframe (1 Token)"}
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: HASIL UI/UX */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !isGenerating ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <LayoutTemplate className="w-8 h-8 text-zinc-700" />
               </div>
               <h3 className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-xs">Awaiting Brief</h3>
               <p className="text-zinc-600 text-sm mt-2 max-w-xs">Isi brief proyek di panel kiri untuk mulai membedah kerangka UI dan Copywriting.</p>
            </div>
          ) : isGenerating ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500/50 mb-6" />
              <h3 className="text-zinc-200 font-bold uppercase tracking-[0.2em] text-xs">Architecting User Experience</h3>
              <p className="text-zinc-500 text-sm mt-2">Menyusun struktur section, nama brand, dan copywriting yang *convert*...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Project & Brand Info */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full" />
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-white">{result!.projectTheme}</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                        <Building2 className="w-3.5 h-3.5" /> Brand: {result!.suggestedCompanyName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                        <Users className="w-3.5 h-3.5" /> Target: {result!.targetAudience}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleCopyAll}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition-colors border border-white/10 shadow-sm"
                  >
                    {copiedField === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copiedField === 'all' ? 'Copied' : 'Copy Full Brief'}
                  </button>
                </div>
              </div>

              {/* Rendering Pages & Sections */}
              {result!.pages.map((page, pageIdx) => (
                <div key={pageIdx} className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-white uppercase tracking-widest pl-2 border-l-2 border-indigo-500 mt-8 mb-4">
                    <Globe className="w-4 h-4 text-indigo-400" /> {page.pageName}
                  </div>

                  <div className="space-y-4">
                    {page.sections.map((section, secIdx) => (
                      <div key={secIdx} className="bg-white/[0.01] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                        
                        {/* Section Header */}
                        <div className="flex items-start justify-between mb-4 border-b border-white/5 pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                              {section.sectionName}
                            </h3>
                            <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-wider">{section.purpose}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* UI Components List */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <Component className="w-3 h-3" /> Rekomendasi Komponen UI
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {section.uiComponents.map((comp, cIdx) => (
                                <span key={cIdx} className="px-2.5 py-1.5 bg-black/40 border border-white/5 rounded-lg text-xs text-zinc-400 font-medium">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Copywriting Details */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <MessageSquare className="w-3 h-3" /> Teks Copywriting
                            </h4>
                            <div className="space-y-2">
                              {section.contentSuggestions.map((content, contIdx) => {
                                const copyId = `copy-${pageIdx}-${secIdx}-${contIdx}`;
                                return (
                                  <div key={contIdx} className="group bg-black/40 border border-white/5 rounded-xl p-3 relative hover:border-indigo-500/30 transition-colors">
                                    <div className="text-[10px] font-bold text-indigo-400/80 mb-1">{content.element}</div>
                                    <p className="text-sm text-zinc-300 font-medium leading-relaxed pr-8">{content.copy}</p>
                                    <button 
                                      onClick={() => handleCopy(content.copy, copyId)}
                                      className="absolute right-3 top-3 p-1.5 bg-white/5 rounded-md text-zinc-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                      {copiedField === copyId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

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