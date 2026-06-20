// src/app/(user)/profile/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Key, 
  Activity, 
  Eye, 
  EyeOff, 
  Loader2, 
  Save, 
  CheckCircle, 
  Zap, 
  Clock, 
  ShieldAlert,
  Coins
} from "lucide-react";

type UserProfile = {
  username: string;
  token_balance: number;
  role: string;
  email?: string;
};

type UsageLog = {
  id: string;
  tool_name: string;
  tokens_used: number;
  created_at: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  
  // State untuk Feedback UI Password
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function loadProfileData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      // Ambil Profil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, token_balance, role")
        .eq("id", authData.user.id)
        .single();
      
      if (profileData) {
        setProfile({
          ...profileData,
          email: authData.user.email
        });
      }

      // Ambil Riwayat Penggunaan (Maksimal 15 terakhir)
      const { data: logsData } = await supabase
        .from("tools_usage")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (logsData) setRecentLogs(logsData);
      setLoading(false);
    }

    loadProfileData();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru dan konfirmasi tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // 1. Verifikasi password saat ini dengan mencoba login ulang (Background)
      if (profile?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: currentPassword,
        });

        if (signInError) {
          throw new Error("Password saat ini salah.");
        }
      }

      // 2. Update ke password baru
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setPasswordSuccess("Password berhasil diperbarui!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      // Hilangkan pesan sukses setelah 3 detik
      setTimeout(() => setPasswordSuccess(""), 3000);

    } catch (err: unknown) {
      // PERBAIKAN TYPE ANY: Menggunakan type narrowing dengan instanceof Error
      const errorMessage = err instanceof Error ? err.message : "Gagal memperbarui password.";
      setPasswordError(errorMessage);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

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
      className="max-w-6xl mx-auto space-y-8 pb-20 relative z-10"
    >
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2 flex items-center gap-3">
          <User className="w-8 h-8 text-blue-400" /> Profil & Pengaturan
        </h1>
        <p className="text-zinc-500 font-medium leading-relaxed">
          Kelola informasi akun, keamanan password, dan lihat riwayat aktivitas penggunaan *engine* Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* KOLOM KIRI: INFO AKUN & UBAH PASSWORD */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card Info Akun */}
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem]">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-6 flex items-center gap-2">
               <User className="w-4 h-4 text-zinc-400" /> Informasi Akun
            </h2>
            <div className="space-y-4">
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Username</p>
                  <p className="text-white font-bold">@{profile?.username}</p>
                </div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  {profile?.role === 'super_admin' ? 'Super Admin' : 'Contributor'}
                </div>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Sisa Token (Quota)</p>
                  <p className="text-white font-bold flex items-center gap-1.5"><Coins className="w-4 h-4 text-emerald-400" /> {profile?.token_balance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Ubah Password */}
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem]">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-6 flex items-center gap-2">
               <Key className="w-4 h-4 text-zinc-400" /> Ubah Password
            </h2>
            
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {/* Input Password Saat Ini */}
              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password Saat Ini</label>
                <div className="relative">
                  <input 
                    type={showPasswords ? "text" : "password"} 
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all pr-12"
                  />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300">
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Input Password Baru */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Password Baru</label>
                <input 
                  type={showPasswords ? "text" : "password"} 
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Input Konfirmasi Password Baru */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Konfirmasi Password Baru</label>
                <input 
                  type={showPasswords ? "text" : "password"} 
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
              </div>

              {/* Feedback Messages */}
              <AnimatePresence>
                {passwordError && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-rose-400 text-xs font-medium flex items-center gap-1.5 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                    <ShieldAlert className="w-4 h-4 shrink-0" /> {passwordError}
                  </motion.div>
                )}
                {passwordSuccess && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                    <CheckCircle className="w-4 h-4 shrink-0" /> {passwordSuccess}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-zinc-100 text-black py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isUpdatingPassword ? "Menyimpan..." : "Simpan Password Baru"}
              </button>
            </form>
          </div>
        </div>

        {/* KOLOM KANAN: RECENT OPERATIONS */}
        <div className="lg:col-span-7">
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] h-full">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
               <Activity className="w-4 h-4 text-zinc-400" /> Riwayat Aktivitas
            </h2>

            <div className="overflow-hidden">
              {recentLogs.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
                  <Clock className="w-8 h-8 text-zinc-700 mb-3" />
                  <p className="text-zinc-500 text-sm font-medium">Belum ada aktivitas. Riwayat penggunaan engine Anda akan muncul di sini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-black/20 text-zinc-500 font-semibold uppercase tracking-widest text-[10px]">
                      <tr>
                        <th className="px-4 py-3 rounded-l-xl">Engine Used</th>
                        <th className="px-4 py-3">Cost</th>
                        <th className="px-4 py-3 text-right rounded-r-xl">Waktu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentLogs.map((log) => {
                        let toolDisplayName = log.tool_name;
                        if (log.tool_name === 'adobe_stock_generator') toolDisplayName = "Metadata (Adobe Stock)";
                        if (log.tool_name === 'canva_generator') toolDisplayName = "Metadata (Canva)";
                        if (log.tool_name === 'file_naming_generator') toolDisplayName = "Logic Naming";
                        if (log.tool_name === 'image_generator') toolDisplayName = "Asset Generator";
                        if (log.tool_name === 'youtube_seo_engine') toolDisplayName = "YouTube SEO";
                        if (log.tool_name === 'saas_blueprint_engine') toolDisplayName = "SaaS Blueprint";

                        return (
                          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-zinc-600" />
                                <span className="font-semibold text-zinc-300 text-sm">{toolDisplayName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1.5 font-mono text-rose-400 text-xs bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20">
                                -{log.tokens_used}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right text-zinc-500 text-xs font-mono">
                              {new Date(log.created_at).toLocaleString("id-ID", {
                                day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                              })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}