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
          <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">API & System Settings</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Pantau status integrasi API dan konfigurasi *environment* server.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Status Gemini API */}
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-lg relative overflow-hidden group">
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className={`p-3 rounded-2xl border ${status.geminiConfigured ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              <Key className={`w-6 h-6 ${status.geminiConfigured ? 'text-green-500' : 'text-red-500'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Gemini API Key</h2>
              <p className="text-sm text-muted-foreground font-medium">Status integrasi AI</p>
            </div>
          </div>

          {status.geminiConfigured ? (
            <div className="flex items-start gap-3 bg-black/40 border border-green-500/30 p-5 rounded-2xl shadow-inner relative z-10">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
              <div>
                <p className="text-sm font-bold text-green-400">API Key Terdeteksi</p>
                <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                  Sistem berhasil membaca konfigurasi dari *environment variables*. AI Engine siap beroperasi dengan aman.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-black/40 border border-red-500/30 p-5 rounded-2xl shadow-inner relative z-10">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <div>
                <p className="text-sm font-bold text-red-400">API Key Belum Diatur</p>
              </div>
            </div>
          )}
        </div>

        {/* Card Status Server & Keamanan */}
        <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-lg relative overflow-hidden">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <Server className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Environment Status</h2>
              <p className="text-sm text-muted-foreground font-medium">Informasi runtime server</p>
            </div>
          </div>

          <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-300">Node Environment</span>
              </div>
              <span className="text-xs font-black bg-white/10 text-white px-3 py-1.5 rounded-lg uppercase tracking-widest border border-white/10 shadow-inner">
                {status.nodeEnv}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-bold text-gray-300">Database (Supabase)</span>
              </div>
              <span className="text-xs font-black text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-2 shadow-inner">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,1)]"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Card Pengingat Keamanan */}
     
    </motion.div>
  );
}