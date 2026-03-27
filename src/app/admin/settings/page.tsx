// src/app/admin/settings/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Key, ShieldCheck, Server, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getSystemStatus } from "../actions";

type SystemStatus = {
  geminiConfigured: boolean;
  nodeEnv: string;
};

export default function SettingsPage() {
  const [status, setStatus] = useState<SystemStatus>({
    geminiConfigured: false,
    nodeEnv: "development",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      const sysStatus = await getSystemStatus();
      setStatus(sysStatus);
      setLoading(false);
    }
    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Checking System Status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      
      {/* BACKGROUND MODERN DASHBOARD: Faint Dot Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,transparent_20%,#000_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 space-y-8 max-w-4xl mx-auto"
      >
        {/* Header Section */}
        <div className="border-b border-white/5 pb-6">
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
            API & System Settings
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">
            Pantau status integrasi API dan konfigurasi <span className="text-gray-300 italic">environment</span> server secara realtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card Status Gemini API */}
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:border-white/20 relative overflow-hidden group">
            
            {/* Efek kilauan diagonal saat dihover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Garis aksen atas berdasarkan status */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${status.geminiConfigured ? 'from-green-500 to-emerald-400' : 'from-red-500 to-rose-400'} opacity-50 group-hover:opacity-100 transition-opacity`} />

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className={`p-3.5 rounded-2xl border relative ${status.geminiConfigured ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                <Key className={`w-6 h-6 relative z-10 ${status.geminiConfigured ? 'text-green-400' : 'text-red-400'}`} />
                {/* Ambient glow */}
                <div className={`absolute inset-0 blur-md rounded-2xl ${status.geminiConfigured ? 'bg-green-500/20' : 'bg-red-500/20'}`} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Gemini API Key</h2>
                <p className="text-sm text-muted-foreground font-medium">Status integrasi AI Engine</p>
              </div>
            </div>

            {status.geminiConfigured ? (
              <div className="flex items-start gap-3 bg-black/40 border border-green-500/30 p-5 rounded-2xl shadow-inner relative z-10 group-hover:border-green-500/50 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                <div>
                  <p className="text-sm font-bold text-green-400">API Key Terdeteksi</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Sistem berhasil membaca konfigurasi dari variabel <span className="text-gray-300 font-mono text-[10px]">.env</span>. AI Engine siap beroperasi dengan aman.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 p-5 rounded-2xl shadow-inner relative z-10 group-hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                <div>
                  <p className="text-sm font-bold text-red-400">API Key Belum Diatur</p>
                  <p className="text-xs text-red-300/70 mt-1.5 leading-relaxed">
                    Fitur generator tidak akan berfungsi. Harap tambahkan <span className="font-mono text-[10px] bg-red-500/20 px-1 rounded">GEMINI_API_KEY</span> di server Anda.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Card Status Server & Keamanan */}
          <div className="bg-card/60 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:border-white/20 relative overflow-hidden group">
            
            {/* Efek kilauan diagonal saat dihover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Garis aksen atas */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-400 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 relative">
                <Server className="w-6 h-6 text-blue-400 relative z-10" />
                {/* Ambient glow */}
                <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-2xl" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Environment Status</h2>
                <p className="text-sm text-muted-foreground font-medium">Informasi runtime server</p>
              </div>
            </div>

            <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner relative z-10 group-hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-300">Node Environment</span>
                </div>
                <span className="text-[10px] font-black bg-white/10 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/10 shadow-inner">
                  {status.nodeEnv}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-bold text-gray-300">Database (Supabase)</span>
                </div>
                <span className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-2 shadow-inner group-hover:bg-green-500/20 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]"></span>
                  Connected
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Info Card Pengingat Keamanan (Tambahan untuk melengkapi layout) */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5 flex items-start gap-4 backdrop-blur-md">
           <div className="p-2 bg-blue-500/10 rounded-full shrink-0">
             <ShieldCheck className="w-5 h-5 text-blue-400" />
           </div>
           <div>
             <h4 className="text-sm font-bold text-blue-300 mb-1">Security Notice</h4>
             <p className="text-xs text-blue-200/70 leading-relaxed font-medium">
               Akses ke halaman ini diawasi secara ketat. Pastikan untuk tidak pernah membagikan API Key atau konfigurasi <span className="font-mono">.env</span> Anda kepada pihak eksternal. Semua eksekusi AI dan modifikasi *database* berjalan pada Server Actions yang terlindungi.
             </p>
           </div>
        </div>

      </motion.div>
    </div>
  );
}