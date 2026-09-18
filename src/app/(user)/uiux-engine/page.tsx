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
import { PageHeading, QuotaMeta } from "@/components/ui/PageHeading";

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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <PageHeading
        stamp="Studio"
        title="UI/UX."
        lede="Kerangka halaman, komponen, dan copywriting siap desain."
        meta={<QuotaMeta value={tokenBalance} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: INPUT FORM */}
        <div className="lg:col-span-4 space-y-6 sticky top-6">
          <div className="bg-bg border border-line p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
               <div className="flex items-center gap-2.5">
                  <Settings2 className="w-4 h-4 text-text-muted" />
                  <h2 className="text-sm font-bold text-text uppercase tracking-widest">Project Brief</h2>
               </div>
            </div>

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tema Industri / Niche</label>
                <input 
                  type="text" 
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Contoh: Klinik Gigi, Firma Hukum, SaaS Akuntansi"
                  className="w-full bg-bg-elevated border border-line px-4 py-3 text-sm text-text focus:outline-none focus:border-text transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Tone of Voice (Gaya Bahasa)</label>
                <input 
                  type="text" 
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="Contoh: Ramah, Mewah, atau Enerjik"
                  className="w-full bg-bg-elevated border border-line px-4 py-3 text-sm text-text focus:outline-none focus:border-text transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Cakupan Desain</label>
                <select 
                  value={pageScope}
                  onChange={(e) => setPageScope(e.target.value)}
                  className="w-full bg-bg-elevated border border-line px-4 py-3 text-sm text-text focus:outline-none focus:border-text appearance-none"
                >
                  <option value="landing_page_only">Landing Page Utama Saja (Header - Footer)</option>
                  <option value="multi_page">Full Website (Multi-page)</option>
                </select>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !theme}
                className="btn-primary mt-2 w-full"
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
            <div className="bg-bg border border-line p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
               <div className="w-16 h-16 bg-wash flex items-center justify-center mb-6 border border-line">
                  <LayoutTemplate className="w-8 h-8 text-text-faint" />
               </div>
               <h3 className="text-text-muted font-bold uppercase tracking-[0.2em] text-xs">Awaiting Brief</h3>
               <p className="text-text-faint text-sm mt-2 max-w-xs">Isi brief proyek di panel kiri untuk mulai membedah kerangka UI dan Copywriting.</p>
            </div>
          ) : isGenerating ? (
            <div className="bg-bg border border-line p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-text-faint mb-6" />
              <h3 className="text-text font-bold uppercase tracking-[0.2em] text-xs">Architecting User Experience</h3>
              <p className="text-text-muted text-sm mt-2">Menyusun struktur section, nama brand, dan copywriting yang *convert*...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Project & Brand Info */}
              <div className="relative overflow-hidden border border-line bg-bg p-8">
                <div className="relative z-10 mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-text">{result!.projectTheme}</h2>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-accent bg-wash px-3 py-1.5 border border-line">
                        <Building2 className="w-3.5 h-3.5" /> Brand: {result!.suggestedCompanyName}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-text-muted bg-wash px-3 py-1.5 border border-line">
                        <Users className="w-3.5 h-3.5" /> Target: {result!.targetAudience}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleCopyAll}
                    className="btn-ghost h-9 px-3 text-xs"
                  >
                    {copiedField === 'all' ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                    {copiedField === 'all' ? 'Copied' : 'Copy Full Brief'}
                  </button>
                </div>
              </div>

              {/* Rendering Pages & Sections */}
              {result!.pages.map((page, pageIdx) => (
                <div key={pageIdx} className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-black text-text uppercase tracking-widest pl-2 border-l-2 border-accent mt-8 mb-4">
                    <Globe className="w-4 h-4 text-accent" /> {page.pageName}
                  </div>

                  <div className="space-y-4">
                    {page.sections.map((section, secIdx) => (
                      <div key={secIdx} className="bg-bg border border-line p-6 hover:border-text transition-colors">
                        
                        {/* Section Header */}
                        <div className="flex items-start justify-between mb-4 border-b border-line pb-4">
                          <div>
                            <h3 className="text-lg font-bold text-text flex items-center gap-2">
                              {section.sectionName}
                            </h3>
                            <p className="text-xs text-text-muted font-medium mt-1 uppercase tracking-wider">{section.purpose}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* UI Components List */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <Component className="w-3 h-3" /> Rekomendasi Komponen UI
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {section.uiComponents.map((comp, cIdx) => (
                                <span key={cIdx} className="px-2.5 py-1.5 bg-bg-elevated border border-line text-xs text-text-muted font-medium">
                                  {comp}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Copywriting Details */}
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-widest flex items-center gap-1.5 mb-2">
                              <MessageSquare className="w-3 h-3" /> Teks Copywriting
                            </h4>
                            <div className="space-y-2">
                              {section.contentSuggestions.map((content, contIdx) => {
                                const copyId = `copy-${pageIdx}-${secIdx}-${contIdx}`;
                                return (
                                  <div key={contIdx} className="group bg-bg-elevated border border-line p-3 relative hover:border-text transition-colors">
                                    <div className="text-[10px] font-bold text-accent mb-1">{content.element}</div>
                                    <p className="text-sm text-text font-medium leading-relaxed pr-8">{content.copy}</p>
                                    <button 
                                      onClick={() => handleCopy(content.copy, copyId)}
                                      className="absolute right-3 top-3 border border-line p-1.5 text-text-muted opacity-0 transition-colors duration-hover hover:border-text hover:bg-text hover:text-bg group-hover:opacity-100"
                                    >
                                      {copiedField === copyId ? <Check className="w-3.5 h-3.5 text-accent" /> : <Copy className="w-3.5 h-3.5" />}
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
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-bg/90">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="bg-bg border border-line w-full max-w-sm p-8 text-center">
              <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text mb-2">Token Habis</h3>
              <p className="text-text-muted text-sm mb-6">Quota harian Anda sudah habis. Tunggu reset otomatis jam 12 siang.</p>
              <button onClick={() => setShowTokenAlert(false)} className="btn-ghost w-full">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}