// src/app/login/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, Lock, User, Sparkles, ArrowLeft } from "lucide-react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions, MoveDirection, OutMode } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim"; 

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
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.05), transparent 40%)`
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

    const dummyEmail = `${username}@metadata.local`;

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password: password,
    });

    if (signInError) {
      setError("Username atau password salah.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .single();

    if (profileError || !profileData) {
      setError("Gagal mengambil data profil.");
      setLoading(false);
      return;
    }

    // --- PERBAIKAN LOGIKA REDIRECT DI SINI ---
    // Mengizinkan role 'admin' DAN 'super_admin' untuk masuk ke dashboard admin
    if (profileData.role === "admin" || profileData.role === "super_admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
    // -----------------------------------------
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} 
      className="w-full max-w-md relative z-10"
    >
      <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 pt-12 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[3px]">
          <div className="w-full h-full bg-gradient-to-r from-canva-cyan via-adobe-pink to-canva-purple animate-pulse shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-black text-foreground mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-muted-foreground text-sm font-medium">
            Sign in to Microstock Research Workspace
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl text-center backdrop-blur-sm"
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Username</label>
            <motion.div className="relative group/input" whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <User className="w-5 h-5 text-gray-500 group-focus-within/input:text-white transition-colors" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-foreground focus:outline-none focus:border-white/30 transition-all shadow-inner relative z-20"
                placeholder="Enter username"
                required
              />
            </motion.div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Password</label>
            <motion.div className="relative group/input" whileFocus={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Lock className="w-5 h-5 text-gray-500 group-focus-within/input:text-white transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-foreground focus:outline-none focus:border-white/30 transition-all shadow-inner relative z-20"
                placeholder="••••••••"
                required
              />
            </motion.div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full relative mt-6 bg-white text-black font-bold rounded-xl py-3.5 flex items-center justify-center disabled:opacity-70 shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden group/btn"
            whileHover={{ scale: 1.01 }} 
            whileTap={{ scale: 0.98 }} 
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Masuk ke Workspace
                  <Sparkles className="w-4 h-4 opacity-70" />
                </>
              )}
            </span>
          </motion.button>
        </form>

        <div className="mt-8 text-center border-t border-white/5 pt-6 relative z-20">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">
            Internal Access Only
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default function LoginPage() {
  const [particlesInit, setParticlesInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: { enable: true, mode: "grab" },
        },
        modes: {
          push: { quantity: 4 },
          grab: { distance: 200, links: { opacity: 0.5 } },
        },
      },
      particles: {
        color: { value: "#ffffff" },
        links: { color: "#ffffff", distance: 150, enable: true, opacity: 0.15, width: 1 },
        move: { direction: MoveDirection.none, enable: true, outModes: { default: OutMode.out }, speed: 1.2 },
        number: { density: { enable: true, area: 800 }, value: 80 },
        opacity: { value: { min: 0.1, max: 0.6 }, animation: { enable: true, speed: 1 } },
        shape: { type: "circle" },
        size: { value: { min: 1, max: 3 } },
      },
      detectRetina: true,
      fullScreen: { enable: false }, 
    }),
    []
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4 antialiased">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-50"
      >
        <Link href="/" className="inline-flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-white transition-colors group">
          <div className="flex items-center justify-center w-9 h-9 bg-white/5 rounded-full border border-white/10 group-hover:bg-white/10 shadow-inner">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>Back to Home</span>
        </Link>
      </motion.div>

      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px]" />

      {particlesInit && (
        <Particles id="tsparticles-login" className="absolute inset-0 z-0 pointer-events-none" options={particlesOptions} />
      )}

      <InteractiveSpotlight />

      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none bg-background">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] bg-canva-purple/10 blur-[130px] rounded-[100%] animate-blob" />
        <div className="absolute top-[20%] left-[30%] w-[50%] h-[40%] bg-adobe-pink/10 blur-[150px] rounded-[100%] animate-blob animation-delay-2000" />
      </div>

      <LoginCard />
    </div>
  );
}