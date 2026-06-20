// src/app/(user)/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  Layers, 
  Image as ImageIcon, 
  ArrowRight, 
  Coins, 
  Loader2,
  RefreshCw,
  AudioLines,
  MonitorPlay,
  Rocket,
  LayoutTemplate,
  Video // <-- Icon untuk Video Engine
} from "lucide-react";

type UserProfile = {
  username: string;
  token_balance: number;
};

export default function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, token_balance")
        .eq("id", authData.user.id)
        .single();
      
      if (profileData) setProfile(profileData);
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-600" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.4 }}
      className="max-w-7xl mx-auto space-y-10 relative z-10"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
            Welcome, {profile?.username}.
          </h1>
          <p className="text-zinc-500 font-medium max-w-xl leading-relaxed">
            Ini adalah <span className="text-zinc-300 font-bold">Workspace</span> utama Anda. Pilih engine otomatisasi yang Anda butuhkan untuk alur kerja hari ini.
          </p>
        </div>
        
        <div className="flex flex-col items-start md:items-end bg-white/[0.02] border border-white/5 p-5 rounded-2xl w-full md:w-auto">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Available Quota</span>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <span className="text-2xl font-mono font-black text-white">{profile?.token_balance}</span>
          </div>
        </div>
      </div>

      {/* Tool Navigation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 1. Metadata Engine */}
        <Link href="/metadata" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Layers size={100} />
            </div>
            <div className="w-12 h-12 bg-white/5 text-zinc-300 rounded-xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-105 transition-transform">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">AI Metadata Engine</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Optimasi judul, 49 keyword presisi, dan kategori untuk Microstock. Lengkap dengan logika penamaan file dan folder.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 2. Image Engine */}
        <Link href="/image-engine" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <ImageIcon size={100} />
            </div>
            <div className="w-12 h-12 bg-white/5 text-zinc-300 rounded-xl flex items-center justify-center mb-6 border border-white/5 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">AI Asset Generator</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Buat &quot;Sticker Sheet&quot; massal dalam satu klik. Solusi hemat kuota untuk memproduksi ratusan aset vektor setiap hari.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 3. Video Stock Engine (NEW FEATURE) */}
        <Link href="/video-engine" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Video size={100} />
            </div>
            <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-xl flex items-center justify-center mb-6 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Video className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Video Stock Engine</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Generate animasi seamless loop 4K berbasis kode. Render langsung di browser menjadi video siap jual tanpa biaya server.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 group-hover:text-amber-300 transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 4. Pro Converter */}
        <Link href="/converter" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <RefreshCw size={100} />
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-105 transition-transform">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">Pro Converter</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Hapus background cerdas, kompresi file tanpa pecah, konversi multi-format, hingga GPU Upscaling untuk kualitas HD.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 5. Voice Studio */}
        <Link href="/voice-studio" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <AudioLines size={100} />
            </div>
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-105 transition-transform">
              <AudioLines className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">AI Voice Studio</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Konversi naskah menjadi suara natural. Mendukung multibahasa dengan kendali pitch dan kecepatan.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 group-hover:text-blue-300 transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 6. YouTube SEO */}
        <Link href="/youtube-seo" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <MonitorPlay size={100} />
            </div>
            <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-xl flex items-center justify-center mb-6 border border-rose-500/20 group-hover:scale-105 transition-transform">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">YouTube SEO Engine</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Optimasi metadata khusus untuk Live Stream game Retro & AAA. Hasilkan judul clickbait dan tags yang meniru gaya bahasa Anda.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 group-hover:text-rose-300 transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 7. SaaS Blueprint */}
        <Link href="/saas-blueprint" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <Rocket size={100} />
            </div>
            <div className="w-12 h-12 bg-zinc-500/10 text-zinc-300 rounded-xl flex items-center justify-center mb-6 border border-zinc-500/20 group-hover:scale-105 transition-transform">
              <Rocket className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">SaaS Blueprint</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Rancang arsitektur perangkat lunak dari ide mentah. Hasilkan daftar fitur, schema database, dan rekomendasi stack secara instan.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 group-hover:text-white transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

        {/* 8. UI/UX Engine */}
        <Link href="/uiux-engine" className="group block h-full">
          <div className="bg-white/[0.01] border border-white/5 p-8 rounded-[2rem] hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-[0.08] transition-opacity">
              <LayoutTemplate size={100} />
            </div>
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:scale-105 transition-transform">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 tracking-tight">UI/UX Engine</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium mb-8 flex-1 relative z-10">
              Rancang struktur halaman dari Header hingga Footer. Lengkap dengan rekomendasi komponen UI dan copywriting profesional.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors mt-auto uppercase tracking-widest relative z-10">
              Launch Engine <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </Link>

      </div>
    </motion.div>
  );
}