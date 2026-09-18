// src/app/(user)/saas-blueprint/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Play, 
  Loader2, 
  Copy, 
  Check, 
  Settings2, 
  Database, 
  Terminal, 
  ListTodo, 
  AlertCircle,
  Lightbulb
} from "lucide-react";
import { generateSaaSBlueprint } from "../actions/blueprint";
import { PageHeading, QuotaMeta } from "@/components/ui/PageHeading";

type BlueprintResult = {
  projectName: string;
  elevatorPitch: string;
  coreFeatures: {
    name: string;
    description: string;
    priority: string;
  }[];
  databaseSchema: {
    tableName: string;
    description: string;
    columns: string[];
  }[];
  suggestedStack: {
    category: string;
    technology: string;
    reason: string;
  }[];
};

export default function SaaSBlueprintPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  // State Form
  const [ideaDescription, setIdeaDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // State Data & UI
  const [result, setResult] = useState<BlueprintResult | null>(null);
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

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    const fullText = `
Project: ${result.projectName}
Pitch: ${result.elevatorPitch}

CORE FEATURES:
${result.coreFeatures.map(f => `- [${f.priority}] ${f.name}: ${f.description}`).join('\n')}

DATABASE SCHEMA:
${result.databaseSchema.map(d => `- Table: ${d.tableName}\n  Desc: ${d.description}\n  Cols: ${d.columns.join(', ')}`).join('\n')}

TECH STACK:
${result.suggestedStack.map(s => `- ${s.category}: ${s.technology} (${s.reason})`).join('\n')}
    `.trim();
    
    handleCopy(fullText, 'all');
  };

  const handleGenerate = async () => {
    if (!userId || !ideaDescription) return;
    if (tokenBalance < 1) {
      setShowTokenAlert(true);
      return;
    }

    setIsGenerating(true);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("ideaDescription", ideaDescription);
    formData.append("targetAudience", targetAudience);

    const res = await generateSaaSBlueprint(formData);
    if (res.success && res.blueprint) {
      setResult(res.blueprint);
      setTokenBalance(res.newTokenBalance ?? tokenBalance);
      window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
        detail: { newTokenBalance: res.newTokenBalance } 
      }));
    } else {
      alert(res.error || "Gagal membuat blueprint");
    }
    setIsGenerating(false);
  };

  const getPriorityColor = (priority: string) => {
    if (priority.includes("P0")) return "border-accent bg-accent text-btn-bg";
    if (priority.includes("P1")) return "border-text bg-btn-bg text-btn-fg";
    return "border-line bg-wash text-text-muted";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-20">
      <PageHeading
        stamp="Studio"
        title="Blueprint."
        lede="Dari ide mentah ke arsitektur: database, fitur inti, dan stack."
        meta={<QuotaMeta value={tokenBalance} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: INPUT */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-bg border border-line p-6 space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-line pb-4">
               <div className="flex items-center gap-2.5">
                  <Lightbulb className="w-4 h-4 text-text-muted" />
                  <h2 className="text-sm font-bold text-text uppercase tracking-widest">Detail Ide</h2>
               </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Deskripsi Aplikasi SaaS</label>
                <textarea 
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  placeholder="Contoh: Aplikasi jurnal trading kripto dengan AI analisis untuk mendeteksi emosi saat loss..."
                  className="w-full bg-bg-elevated border border-line px-4 py-3 text-sm text-text focus:outline-none focus:border-text transition-all h-32 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Target Audiens (Opsional)</label>
                <input 
                  type="text" 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Contoh: Trader harian, Scalper"
                  className="w-full bg-bg-elevated border border-line px-4 py-3 text-sm text-text focus:outline-none focus:border-text transition-all"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !ideaDescription}
                className="btn-primary mt-4 w-full"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isGenerating ? "Merancang Arsitektur..." : "Generate Blueprint (1 Token)"}
              </button>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN: HASIL BLUEPRINT */}
        <div className="lg:col-span-8 space-y-6">
          {!result && !isGenerating ? (
            <div className="bg-bg border border-line p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
               <div className="w-16 h-16 bg-wash flex items-center justify-center mb-6 border border-line">
                  <Settings2 className="w-8 h-8 text-text-faint animate-[spin_4s_linear_infinite]" />
               </div>
               <h3 className="text-text-muted font-bold uppercase tracking-[0.2em] text-xs">Waiting for Input</h3>
               <p className="text-text-faint text-sm mt-2 max-w-xs">Deskripsikan ide Anda di panel kiri untuk mulai memetakan fitur dan database.</p>
            </div>
          ) : isGenerating ? (
            <div className="bg-bg border border-line p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-text-faint mb-6" />
              <h3 className="text-text font-bold uppercase tracking-[0.2em] text-xs">Architecting Solutions</h3>
              <p className="text-text-muted text-sm mt-2">Gemini sedang menyusun skema database dan prioritas fitur...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Project */}
              <div className="relative overflow-hidden border border-line bg-bg p-8">
                <div className="relative z-10 mb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-text">{result!.projectName}</h2>
                    <p className="text-accent text-sm font-medium mt-1">{result!.elevatorPitch}</p>
                  </div>
                  <button 
                    onClick={handleCopyAll}
                    className="btn-ghost h-9 px-3 text-xs"
                  >
                    {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'all' ? 'Copied' : 'Copy Full Blueprint'}
                  </button>
                </div>
              </div>

              {/* Core Features */}
              <div className="bg-bg border border-line p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest pb-2 border-b border-line">
                  <ListTodo className="w-4 h-4" /> Core Features (MVP)
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {result!.coreFeatures.map((feature, idx) => (
                    <div key={idx} className="bg-bg-elevated border border-line p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className={`px-2 py-1 text-[10px] font-black tracking-wider border shrink-0 ${getPriorityColor(feature.priority)}`}>
                        {feature.priority.split(' ')[0]} {/* Menampilkan P0/P1/P2 saja */}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-text">{feature.name}</h4>
                        <p className="text-sm text-text-muted mt-1 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Schema */}
              <div className="bg-bg border border-line p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest pb-2 border-b border-line">
                  <Database className="w-4 h-4" /> Database Schema
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result!.databaseSchema.map((table, idx) => (
                    <div key={idx} className="bg-bg-elevated border border-line p-4">
                      <h4 className="text-sm font-bold text-text flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 bg-accent" />
                        {table.tableName}
                      </h4>
                      <p className="text-xs text-text-muted mb-3">{table.description}</p>
                      <div className="space-y-1">
                        {table.columns.map((col, cIdx) => (
                          <div key={cIdx} className="bg-wash px-2 py-1 font-mono text-xs text-text-muted">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Stack */}
              <div className="bg-bg border border-line p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-widest pb-2 border-b border-line">
                  <Terminal className="w-4 h-4" /> Recommended Tech Stack
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result!.suggestedStack.map((stack, idx) => (
                    <div key={idx} className="bg-bg-elevated border border-line p-4 border-l-2 border-l-accent hover:border-l-accent transition-colors">
                      <div className="text-[10px] text-accent/80 font-bold uppercase tracking-wider mb-1">{stack.category}</div>
                      <h4 className="text-sm font-bold text-text">{stack.technology}</h4>
                      <p className="text-xs text-text-muted mt-1">{stack.reason}</p>
                    </div>
                  ))}
                </div>
              </div>

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