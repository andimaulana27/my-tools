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
    if (priority.includes("P0")) return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    if (priority.includes("P1")) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 pb-20 relative z-10">
      
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400">
              <Rocket className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SaaS Blueprint Architect</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
            Ubah ide aplikasi mentah Anda menjadi <span className="text-zinc-300 font-bold">Arsitektur Teknis</span> yang terstruktur. AI akan merancang database, fitur inti, dan rekomendasi stack.
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
        
        {/* KOLOM KIRI: INPUT */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6 sticky top-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
               <div className="flex items-center gap-2.5">
                  <Lightbulb className="w-4 h-4 text-zinc-400" />
                  <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Detail Ide</h2>
               </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Deskripsi Aplikasi SaaS</label>
                <textarea 
                  value={ideaDescription}
                  onChange={(e) => setIdeaDescription(e.target.value)}
                  placeholder="Contoh: Aplikasi jurnal trading kripto dengan AI analisis untuk mendeteksi emosi saat loss..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all h-32 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Audiens (Opsional)</label>
                <input 
                  type="text" 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Contoh: Trader harian, Scalper"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isGenerating || !ideaDescription}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 hover:bg-blue-500 transition-all active:scale-[0.98] disabled:opacity-50 mt-4"
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
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
               <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5">
                  <Settings2 className="w-8 h-8 text-zinc-700 animate-[spin_4s_linear_infinite]" />
               </div>
               <h3 className="text-zinc-400 font-bold uppercase tracking-[0.2em] text-xs">Waiting for Input</h3>
               <p className="text-zinc-600 text-sm mt-2 max-w-xs">Deskripsikan ide Anda di panel kiri untuk mulai memetakan fitur dan database.</p>
            </div>
          ) : isGenerating ? (
            <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
              <Loader2 className="w-10 h-10 animate-spin text-blue-500/50 mb-6" />
              <h3 className="text-zinc-200 font-bold uppercase tracking-[0.2em] text-xs">Architecting Solutions</h3>
              <p className="text-zinc-500 text-sm mt-2">Gemini sedang menyusun skema database dan prioritas fitur...</p>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Header Project */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h2 className="text-2xl font-black text-white">{result!.projectName}</h2>
                    <p className="text-blue-400 text-sm font-medium mt-1">{result!.elevatorPitch}</p>
                  </div>
                  <button 
                    onClick={handleCopyAll}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-300 transition-colors border border-white/10"
                  >
                    {copiedField === 'all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedField === 'all' ? 'Copied' : 'Copy Full Blueprint'}
                  </button>
                </div>
              </div>

              {/* Core Features */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/5">
                  <ListTodo className="w-4 h-4" /> Core Features (MVP)
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {result!.coreFeatures.map((feature, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-4">
                      <div className={`px-2 py-1 rounded text-[10px] font-black tracking-wider border shrink-0 ${getPriorityColor(feature.priority)}`}>
                        {feature.priority.split(' ')[0]} {/* Menampilkan P0/P1/P2 saja */}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-zinc-200">{feature.name}</h4>
                        <p className="text-sm text-zinc-500 mt-1 leading-relaxed">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Schema */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/5">
                  <Database className="w-4 h-4" /> Database Schema
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result!.databaseSchema.map((table, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {table.tableName}
                      </h4>
                      <p className="text-xs text-zinc-500 mb-3">{table.description}</p>
                      <div className="space-y-1">
                        {table.columns.map((col, cIdx) => (
                          <div key={cIdx} className="text-xs font-mono text-zinc-400 bg-white/5 px-2 py-1 rounded">
                            {col}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggested Stack */}
              <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-white/5">
                  <Terminal className="w-4 h-4" /> Recommended Tech Stack
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result!.suggestedStack.map((stack, idx) => (
                    <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-4 border-l-2 border-l-blue-500/50 hover:border-l-blue-400 transition-colors">
                      <div className="text-[10px] text-blue-400/80 font-bold uppercase tracking-wider mb-1">{stack.category}</div>
                      <h4 className="text-sm font-bold text-zinc-200">{stack.technology}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{stack.reason}</p>
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