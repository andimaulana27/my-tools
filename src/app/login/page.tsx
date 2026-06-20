// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, Lock, User, Sparkles, ArrowLeft, Command } from "lucide-react";

// Senter interaktif yang halus sesuai tema My Tools
const InteractiveSpotlight = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      requestAnimationFrame(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 mix-blend-screen"
      style={{
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 40%)`
      }}
    />
  );
};

const LoginCard = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Konsisten menggunakan domain .com yang sudah didaftarkan
    const dummyEmail = `${username}@microstock.com`;

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: password,
    });

    if (signInError) {
      setError("Kredensial akses tidak valid.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .single();

    if (profileError || !profileData) {
      setError("Gagal sinkronisasi profil.");
      setLoading(false);
      return;
    }

    if (profileData.role === "admin" || profileData.role === "super_admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }} 
      className="w-full max-w-[400px] relative z-10"
    >
      <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
        {/* Dekorasi Aksen Atas yang Tipis */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="mb-10 text-center">
          <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-6">
            <Command className="w-6 h-6 text-zinc-100" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">System Login</h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em]">
            My Tools Workspace
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-4 rounded-xl text-center"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Username</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all shadow-inner"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600 group-focus-within:text-white transition-colors" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-all shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-100 text-black font-bold rounded-xl py-4 flex items-center justify-center disabled:opacity-50 hover:bg-white transition-all active:scale-[0.98] shadow-lg mt-4 text-sm"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                Authorize Access
                <Sparkles className="w-4 h-4 opacity-50" />
              </span>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[9px] text-zinc-700 uppercase tracking-[0.3em] font-black">
            Private Instance Only
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#050505] p-4 antialiased">
      
      {/* Background Layer: Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] animate-grid opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-8 left-8 z-50"
      >
        <Link href="/" className="inline-flex items-center gap-3 text-[11px] font-bold text-zinc-500 hover:text-white transition-all uppercase tracking-widest group">
          <div className="flex items-center justify-center w-8 h-8 bg-white/5 rounded-lg border border-white/10 group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span>Exit to Home</span>
        </Link>
      </motion.div>

      <InteractiveSpotlight />

      {/* Subtle Aurora Background */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] bg-zinc-800/10 blur-[130px] rounded-[100%]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-zinc-900/10 blur-[150px] rounded-[100%]" />
      </div>

      <LoginCard />
    </div>
  );
}