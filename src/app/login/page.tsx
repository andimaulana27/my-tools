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

// 1. KOMPONEN SENTER TERPISAH
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

// 2. KOMPONEN FORM LOGIN TERPISAH (Agar saat mengetik, halaman utama/partikel tidak ikut re-render)
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

    // Trik: Mengubah username menjadi email dummy di balik layar
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

    // Ambil role dari tabel profiles
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

    // Redirect berdasarkan role
    if (profileData.role === "admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} 
      className="w-full max-w-md relative z-10"
    >
      {/* Card Glassmorphism */}
      <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 pt-12 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        
        {/* Garis Gradient Halus di Atas Card dengan Efek Berdenyut (Pulse) */}
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

          {/* Input Username */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Username</label>
            <motion.div 
              className="relative group/input"
              whileFocus={{ scale: 1.02 }} 
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                variants={{ focus: { x: [0, -2, 2, -1, 1, 0], transition: { duration: 0.4 } } }}
              >
                <User className="w-5 h-5 text-gray-500 group-focus-within/input:text-white group-hover/input:text-gray-300 transition-colors" />
              </motion.div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner relative z-20"
                placeholder="Enter username"
                required
              />
            </motion.div>
          </div>

          {/* Input Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-300 ml-1">Password</label>
            <motion.div 
              className="relative group/input"
              whileFocus={{ scale: 1.02 }} 
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                variants={{ focus: { x: [0, -2, 2, -1, 1, 0], transition: { duration: 0.4 } } }}
              >
                <Lock className="w-5 h-5 text-gray-500 group-focus-within/input:text-white group-hover/input:text-gray-300 transition-colors" />
              </motion.div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner relative z-20"
                placeholder="••••••••"
                required
              />
            </motion.div>
          </div>

          {/* Tombol Login */}
          <motion.button
            type="submit"
            disabled={loading}
            className="w-full relative mt-6 bg-white text-black font-bold rounded-xl py-3.5 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden group/btn"
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }} 
            whileTap={{ scale: 0.98 }} 
          >
            <div className="absolute inset-0 w-full h-full transform -translate-x-full group-hover/btn:translate-x-full bg-gradient-to-r from-transparent via-black/10 to-transparent transition-transform duration-700 ease-in-out" style={{ transitionDelay: '0.1s' }} />

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

        {/* Footer Card Samar */}
        <div className="mt-8 text-center border-t border-white/5 pt-6 relative z-20">
          <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">
            Internal Access Only
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// 3. KOMPONEN HALAMAN UTAMA (Hanya merender statis & komponen anak)
export default function LoginPage() {
  const [particlesInit, setParticlesInit] = useState(false);

  // Inisialisasi engine particles (hanya sekali saat mount)
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  // Konfigurasi Partikel (Konsisten dengan Homepage)
  const particlesOptions: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 120,
      interactivity: {
        events: {
          onClick: { enable: true, mode: "push" },
          onHover: { 
            enable: true, 
            mode: "grab", 
            parallax: { enable: true, force: 60, smooth: 10 } 
          },
        },
        modes: {
          push: { quantity: 4 },
          grab: { distance: 200, links: { opacity: 0.5 } },
        },
      },
      particles: {
        color: { value: "#ffffff" },
        links: {
          color: "#ffffff",
          distance: 150,
          enable: true, 
          opacity: 0.15,
          width: 1,
        },
        move: {
          direction: MoveDirection.none,
          enable: true, 
          outModes: { default: OutMode.out },
          random: true, 
          speed: 1.2, 
          straight: false,
        },
        number: {
          density: { enable: true, area: 800 },
          value: 80, 
        },
        opacity: {
          value: { min: 0.1, max: 0.6 }, 
          animation: { enable: true, speed: 1, sync: false }
        },
        shape: { type: "circle" },
        size: {
          value: { min: 1, max: 3 },
        },
      },
      detectRetina: true,
      fullScreen: { enable: false }, 
    }),
    []
  );

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4 antialiased">
      
      {/* Tombol Kembali ke Home (Floating Top Left) - DIPERBAIKI PRESISINYA */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-50"
      >
        <Link 
          href="/" 
          className="inline-flex items-center gap-3 text-sm font-bold text-gray-400 hover:text-white transition-colors group backdrop-blur-sm"
        >
          {/* Container ikon dibuat proporsional dan presisi ke tengah */}
          <div className="flex items-center justify-center w-9 h-9 bg-white/5 rounded-full border border-white/10 group-hover:bg-white/10 transition-colors shadow-inner">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span>Back to Home</span>
        </Link>
      </motion.div>

      {/* Efek Background Premium: Retro Grid / Dot Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Efek Partikel Bergerak & Saling Terhubung (tsParticles) */}
      {particlesInit && (
        <Particles
          id="tsparticles-login"
          className="absolute inset-0 z-0 pointer-events-none"
          options={particlesOptions}
        />
      )}

      {/* Efek Senter Interaktif (Terpisah) */}
      <InteractiveSpotlight />

      {/* Efek Latar Belakang Colorful Aurora */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none bg-background [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_80%,transparent_100%)]">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] bg-canva-purple/10 blur-[130px] rounded-[100%] animate-blob transform -rotate-12" />
        <div className="absolute top-[20%] left-[30%] w-[50%] h-[40%] bg-adobe-pink/10 blur-[150px] rounded-[100%] animate-blob animation-delay-2000 transform rotate-12" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[50%] bg-canva-cyan/10 blur-[140px] rounded-[100%] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Memanggil Komponen Login Card yang sudah diisolasi statenya */}
      <LoginCard />

    </div>
  );
}