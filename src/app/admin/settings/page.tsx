// src/app/admin/settings/page.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Save, 
  Key, 
  Database, 
  ShieldAlert, 
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // State simulasi pengaturan (Anda bisa menyambungkannya ke database/env nanti)
  const [config, setConfig] = useState({
    defaultTokens: 100,
    maintenanceMode: false,
    apiKey: "••••••••••••••••••••••••••••••••",
    maxBatchSize: 10
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    // Simulasi delay API save
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSaving(false);
    setSaveSuccess(true);
    
    // Hilangkan pesan sukses setelah 3 detik
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="relative min-h-full">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 max-w-4xl mx-auto space-y-8"
      >
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              System Settings
            </h1>
            <p className="text-zinc-500 mt-2 text-sm font-medium">
              Manage global configurations, API keys, and environment security protocols.
            </p>
          </div>
          <div className="flex items-center w-full sm:w-auto">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto bg-zinc-100 text-black px-6 py-2.5 rounded-lg font-bold hover:bg-white transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95 text-sm disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Pesan Sukses Mengambang */}
        {saveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-3 text-sm font-bold"
          >
            <CheckCircle2 className="w-5 h-5" />
            Konfigurasi sistem berhasil diperbarui.
          </motion.div>
        )}

        <form className="space-y-6" onSubmit={e => e.preventDefault()}>
          
          {/* Section 1: User Defaults */}
          <section className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <Database className="w-4 h-4 text-zinc-400" />
              <h2 className="text-base font-semibold text-white">Default Quota Allocation</h2>
            </div>
            <div className="p-6 space-y-6 bg-black/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <label className="text-sm font-bold text-zinc-200 block mb-1">Initial User Tokens</label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Jumlah token RPD (Request Per Day) default yang akan diberikan secara otomatis saat akun Contributor baru dibuat.
                  </p>
                </div>
                <div className="w-full md:w-32 shrink-0">
                  <input
                    type="number"
                    value={config.defaultTokens}
                    onChange={e => setConfig({...config, defaultTokens: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: API Provider Configuration */}
          <section className="bg-white/[0.01] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
              <Key className="w-4 h-4 text-zinc-400" />
              <h2 className="text-base font-semibold text-white">API Core Integration</h2>
            </div>
            <div className="p-6 space-y-8 bg-black/20">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <label className="text-sm font-bold text-zinc-200 block mb-1">Google Gemini API Key</label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Kredensial rahasia untuk mengakses model AI. Diatur melalui environment variables (<code>.env</code>) demi keamanan.
                  </p>
                </div>
                <div className="w-full md:w-64 shrink-0">
                  <input
                    type="text"
                    disabled
                    value={config.apiKey}
                    className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2 text-sm font-mono text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="h-px w-full bg-white/5" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <label className="text-sm font-bold text-zinc-200 block mb-1">Max Batch Generation</label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Batas maksimum antrean gambar yang boleh diproses dalam satu klik untuk mencegah *Rate Limit Vercel*.
                  </p>
                </div>
                <div className="w-full md:w-32 shrink-0">
                  <input
                    type="number"
                    value={config.maxBatchSize}
                    onChange={e => setConfig({...config, maxBatchSize: Number(e.target.value)})}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm font-mono text-white focus:outline-none focus:border-white/30 transition-colors"
                  />
                </div>
              </div>

            </div>
          </section>

          {/* Section 3: Danger Zone */}
          <section className="bg-rose-500/[0.02] border border-rose-500/10 rounded-2xl overflow-hidden mt-8">
            <div className="p-6 border-b border-rose-500/10 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h2 className="text-base font-semibold text-rose-500">Danger Zone</h2>
            </div>
            <div className="p-6 space-y-6 bg-black/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <label className="text-sm font-bold text-zinc-200 block mb-1">System Maintenance Mode</label>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    Aktifkan ini untuk menghentikan seluruh aktivitas pengguna. Hanya pengguna ber-role <code>super_admin</code> yang dapat mengakses workspace.
                  </p>
                </div>
                
                {/* Toggle Switch Minimalist */}
                <button
                  type="button"
                  onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    config.maintenanceMode ? 'bg-rose-500' : 'bg-white/10'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      config.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </section>

        </form>
      </motion.div>
    </div>
  );
}