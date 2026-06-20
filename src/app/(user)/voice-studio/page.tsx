// src/app/(user)/voice-studio/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  AudioLines, 
  Settings2, 
  Play, 
  Loader2, 
  AlertCircle, 
  Download, 
  Volume2,
  Trash2,
  Languages,
  Lightbulb,
  Info,
  SlidersHorizontal,
  Globe,
  ChevronDown
} from "lucide-react";
import { generateTTS } from "../actions/voice";

type AudioRecord = {
  id: string;
  text: string;
  voiceName: string;
  audioUrl: string;
  createdAt: Date;
};

// Kategori Bahasa
const LANGUAGES = [
  { code: "ID", name: "Indonesian" },
  { code: "EN", name: "English (Global)" },
  { code: "JP", name: "Japanese (Jepang)" },
  { code: "KR", name: "Korean (Korea)" },
  { code: "CN", name: "Mandarin (China)" },
  { code: "ES", name: "Spanish (Spanyol)" },
  { code: "FR", name: "French (Perancis)" },
  { code: "DE", name: "German (Jerman)" },
  { code: "IT", name: "Italian (Italia)" },
  { code: "AR", name: "Arabic (Arab)" },
];

// Koleksi Lengkap Voice Actor dengan grouping
const VOICES = [
  // Indonesian
  { id: "id-ID-GadisNeural", name: "Gadis", lang: "ID", gender: "Female", desc: "Natural, Ramah", group: "ID" },
  { id: "id-ID-ArdiNeural", name: "Ardi", lang: "ID", gender: "Male", desc: "Tegas, Profesional", group: "ID" },
  
  // English
  { id: "en-US-JennyNeural", name: "Jenny", lang: "EN (US)", gender: "Female", desc: "Jelas, Podcast", group: "EN" },
  { id: "en-US-GuyNeural", name: "Guy", lang: "EN (US)", gender: "Male", desc: "Bercerita, Hangat", group: "EN" },
  { id: "en-GB-SoniaNeural", name: "Sonia", lang: "EN (UK)", gender: "Female", desc: "British, Elegan", group: "EN" },
  { id: "en-GB-RyanNeural", name: "Ryan", lang: "EN (UK)", gender: "Male", desc: "British, Formal", group: "EN" },
  { id: "en-AU-NatashaNeural", name: "Natasha", lang: "EN (AU)", gender: "Female", desc: "Aussie, Santai", group: "EN" },
  
  // Japanese
  { id: "ja-JP-NanamiNeural", name: "Nanami", lang: "JP", gender: "Female", desc: "Anime, Ceria", group: "JP" },
  { id: "ja-JP-KeitaNeural", name: "Keita", lang: "JP", gender: "Male", desc: "Tegas, Ekspresif", group: "JP" },
  
  // Korean
  { id: "ko-KR-SunHiNeural", name: "SunHi", lang: "KR", gender: "Female", desc: "Lembut, Jelas", group: "KR" },
  { id: "ko-KR-InJoonNeural", name: "InJoon", lang: "KR", gender: "Male", desc: "Profesional, Berita", group: "KR" },
  
  // Chinese (Mandarin)
  { id: "zh-CN-XiaoxiaoNeural", name: "Xiaoxiao", lang: "CN", gender: "Female", desc: "Natural, Hangat", group: "CN" },
  { id: "zh-CN-YunxiNeural", name: "Yunxi", lang: "CN", gender: "Male", desc: "Narasi, Tegas", group: "CN" },
  
  // Spanish
  { id: "es-ES-ElviraNeural", name: "Elvira", lang: "ES", gender: "Female", desc: "Spanyol, Jelas", group: "ES" },
  { id: "es-ES-AlvaroNeural", name: "Alvaro", lang: "ES", gender: "Male", desc: "Spanyol, Kasual", group: "ES" },
  
  // French
  { id: "fr-FR-DeniseNeural", name: "Denise", lang: "FR", gender: "Female", desc: "French, Elegan", group: "FR" },
  { id: "fr-FR-HenriNeural", name: "Henri", lang: "FR", gender: "Male", desc: "French, Berwibawa", group: "FR" },
  
  // German
  { id: "de-DE-KatjaNeural", name: "Katja", lang: "DE", gender: "Female", desc: "German, Profesional", group: "DE" },
  { id: "de-DE-ConradNeural", name: "Conrad", lang: "DE", gender: "Male", desc: "German, Narator", group: "DE" },

  // Italian
  { id: "it-IT-ElsaNeural", name: "Elsa", lang: "IT", gender: "Female", desc: "Italian, Ekspresif", group: "IT" },
  { id: "it-IT-DiegoNeural", name: "Diego", lang: "IT", gender: "Male", desc: "Italian, Dinamis", group: "IT" },
  
  // Arabic
  { id: "ar-SA-ZariyahNeural", name: "Zariyah", lang: "AR", gender: "Female", desc: "Arab, Formal", group: "AR" },
  { id: "ar-SA-HamedNeural", name: "Hamed", lang: "AR", gender: "Male", desc: "Arab, Jelas", group: "AR" },
];

export default function VoiceStudioPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  
  const [textInput, setTextInput] = useState("");
  
  // State untuk hierarki dropdown
  const [selectedLang, setSelectedLang] = useState<string>(LANGUAGES[0].code);
  const [selectedVoice, setSelectedVoice] = useState<string>(VOICES[0].id);
  
  // Voice Tuning States
  const [voiceSpeed, setVoiceSpeed] = useState(0); // -50% to 50%
  const [voicePitch, setVoicePitch] = useState(0); // -50Hz to +50Hz

  const [isProcessing, setIsProcessing] = useState(false);
  const [showTokenAlert, setShowTokenAlert] = useState(false);
  
  const [history, setHistory] = useState<AudioRecord[]>([]);

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

  // Handle perubahan dropdown bahasa
  const handleLanguageChange = (langCode: string) => {
    setSelectedLang(langCode);
    // Otomatis pilih voice pertama dari bahasa yang baru dipilih agar tidak error
    const firstVoiceOfLang = VOICES.find(v => v.group === langCode);
    if (firstVoiceOfLang) {
      setSelectedVoice(firstVoiceOfLang.id);
    }
  };

  const handleGenerate = async () => {
    if (!textInput.trim() || !userId) return;
    if (tokenBalance < 1) {
      setShowTokenAlert(true);
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("text", textInput);
      formData.append("voice", selectedVoice);
      formData.append("speed", voiceSpeed.toString());
      formData.append("pitch", voicePitch.toString());

      const result = await generateTTS(formData);

      if (result.success && result.audioDataUrl) {
        const res = await fetch(result.audioDataUrl);
        const blob = await res.blob();
        const safeAudioUrl = URL.createObjectURL(blob);

        const newRecord: AudioRecord = {
          id: Math.random().toString(36).substring(7),
          text: textInput.substring(0, 50) + (textInput.length > 50 ? "..." : ""),
          voiceName: VOICES.find(v => v.id === selectedVoice)?.name || "Unknown",
          audioUrl: safeAudioUrl,
          createdAt: new Date()
        };

        setHistory(prev => [newRecord, ...prev]);
        const currentBalance = result.newTokenBalance ?? (tokenBalance - 1);
        setTokenBalance(currentBalance);
        window.dispatchEvent(new CustomEvent('tokenBalanceUpdated', { 
          detail: { newTokenBalance: currentBalance } 
        }));
      } else {
        alert(result.error || "Gagal menghasilkan suara.");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan internal.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearHistory = () => {
    history.forEach(h => URL.revokeObjectURL(h.audioUrl));
    setHistory([]);
  };

  // Filter voice actors berdasarkan bahasa yang dipilih
  const filteredVoices = VOICES.filter(v => v.group === selectedLang);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-8 relative z-10 pb-20">
      
      {/* HEADER PANEL */}
      <div className="relative overflow-hidden rounded-[2rem] bg-white/[0.01] border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-4 mb-3">
            <div className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/20 text-blue-400">
              <AudioLines className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">AI Voice Studio</h1>
          </div>
          <p className="text-zinc-500 text-sm font-medium max-w-xl leading-relaxed">
            Hasilkan voice-over multi-bahasa dengan intonasi natural. Gunakan Voice Tuning untuk mengatur tempo dan karakteristik suara.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* KOLOM KIRI: CONFIG & TIPS */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
              <Settings2 className="w-4 h-4 text-zinc-400" />
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest">Configuration</h2>
            </div>

            {/* DROPDOWN LANGUAGE (NEW) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3" /> Select Language
              </label>
              <div className="relative group">
                <select
                  value={selectedLang}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 px-4 text-sm font-bold text-white focus:outline-none focus:border-white/30 transition-colors appearance-none cursor-pointer group-hover:border-white/20"
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-zinc-900 text-white">
                      {lang.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none group-hover:text-zinc-300 transition-colors" />
              </div>
            </div>

            {/* VOICE SELECTION (Filtered) */}
            <div className="space-y-2 pt-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Voice Actors</label>
              <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence mode="popLayout">
                  {filteredVoices.map((v) => (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={v.id} 
                      onClick={() => setSelectedVoice(v.id)} 
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between group ${
                        selectedVoice === v.id ? 'bg-blue-500/10 border-blue-500/30' : 'bg-black/20 border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div>
                        <h3 className={`text-sm font-bold ${selectedVoice === v.id ? 'text-blue-400' : 'text-zinc-200'}`}>
                          {v.name} <span className="text-[10px] font-normal text-zinc-500 ml-1">({v.gender})</span>
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1.5">
                          <Languages className="w-3 h-3"/> {v.lang} &bull; {v.desc}
                        </p>
                      </div>
                      <div className={`w-3 h-3 rounded-full border-2 ${selectedVoice === v.id ? 'border-blue-400 bg-blue-400/20' : 'border-zinc-600'}`} />
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* VOICE TUNING */}
            <div className="pt-4 border-t border-white/5 space-y-5">
              <div className="flex items-center gap-2 text-zinc-400 mb-1">
                 <SlidersHorizontal className="w-4 h-4" />
                 <h2 className="text-xs font-bold uppercase tracking-widest">Voice Tuning</h2>
              </div>
              
              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase">
                    <span>Speed Rate</span>
                    <span className="text-blue-400 font-mono">{voiceSpeed >= 0 ? `+${voiceSpeed}%` : `${voiceSpeed}%`}</span>
                 </div>
                 <input 
                   type="range" min="-50" max="50" value={voiceSpeed} onChange={(e) => setVoiceSpeed(Number(e.target.value))}
                   className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
                 <p className="text-[9px] text-zinc-600 font-medium">Tips: Turunkan -10% s/d -15% agar Gadis lebih natural.</p>
              </div>

              <div className="space-y-2">
                 <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase">
                    <span>Pitch (Nada)</span>
                    <span className="text-blue-400 font-mono">{voicePitch >= 0 ? `+${voicePitch}Hz` : `${voicePitch}Hz`}</span>
                 </div>
                 <input 
                   type="range" min="-50" max="50" value={voicePitch} onChange={(e) => setVoicePitch(Number(e.target.value))}
                   className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
                 <p className="text-[9px] text-zinc-600 font-medium">Tips: Turunkan -5Hz untuk mengurangi suara robot/cempreng.</p>
              </div>
            </div>
          </div>

          {/* TIPS PANEL */}
          <div className="bg-amber-500/[0.03] border border-amber-500/10 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Lightbulb className="w-4 h-4" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Pro Tips (AI Voices)</h2>
            </div>
            <ul className="space-y-3">
              {[
                { title: "Kesesuaian Bahasa", desc: "Pastikan teks yang ditulis sesuai dengan bahasa yang dipilih agar AI tidak salah baca." },
                { title: "Jeda Dramatis (...)", desc: "Gunakan 3 titik untuk memberikan jeda napas yang lebih panjang pada narasi." },
                { title: "Tanda Baca", desc: "Tanda tanya (?) dan koma (,) sangat memengaruhi intonasi dan kecepatan." }
              ].map((tip, i) => (
                <li key={i} className="space-y-1">
                  <p className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                    <Info className="w-3 h-3 text-amber-500/50" /> {tip.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">{tip.desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* KOLOM KANAN: WORKSPACE & HISTORY */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col relative">
            <textarea 
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Ketik skrip Anda di sini sesuai dengan bahasa yang dipilih..."
              className="w-full h-48 bg-transparent text-zinc-200 text-sm resize-none focus:outline-none placeholder:text-zinc-600 custom-scrollbar"
            />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                {textInput.length} Characters
              </div>
              <button 
                onClick={handleGenerate} 
                disabled={isProcessing || !textInput.trim()} 
                className="px-8 py-3 bg-zinc-100 text-black rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                {isProcessing ? "Synthesizing..." : "Generate Voice"}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Recent Takes</h3>
                <button onClick={handleClearHistory} className="text-xs text-rose-500/70 hover:text-rose-400 flex items-center gap-1 transition-colors">
                  <Trash2 className="w-3 h-3"/> Clear
                </button>
              </div>
              {history.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-white/5 rounded-2xl bg-white/[0.01] hover:bg-white/[0.02] transition-colors">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <p className="text-sm font-bold text-zinc-200">Voice: {item.voiceName}</p>
                    <p className="text-[11px] text-zinc-500 mt-1 truncate max-w-sm">&quot;{item.text}&quot;</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <audio controls src={item.audioUrl} className="h-8 w-full sm:w-48" />
                    <a 
                      href={item.audioUrl} 
                      download={`Voice_${item.voiceName}_${item.id}.mp3`}
                      className="p-2.5 bg-zinc-100 hover:bg-white text-black font-bold border border-white/5 rounded-xl transition-all active:scale-95 shadow-sm shrink-0"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showTokenAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} className="bg-[#0a0a0a] border border-white/10 w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl">
              <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Insufficient Quota</h3>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed">Sisa token Anda tidak mencukupi.</p>
              <button onClick={() => setShowTokenAlert(false)} className="w-full bg-white/5 border border-white/10 text-white font-bold py-3 rounded-lg hover:bg-white/10 transition-colors">Dismiss</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}