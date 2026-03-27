// src/app/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Image as ImageIcon, Cpu, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { type ISourceOptions, MoveDirection, OutMode } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim"; 

// 1. KOMPONEN BARU: Memisahkan efek senter agar tidak me-render ulang seluruh halaman
const InteractiveSpotlight = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Menggunakan requestAnimationFrame agar performa mouse tracking lebih ringan
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
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.06), transparent 40%)`
      }}
    />
  );
};

export default function HomePage() {
  const [particlesInit, setParticlesInit] = useState(false);

  // Inisialisasi engine particles (hanya sekali saat mount)
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setParticlesInit(true);
    });
  }, []);

  // Konfigurasi Gerakan Partikel (Efek Jaringan AI)
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      
      {/* Efek Background Premium: Retro Grid / Dot Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

      {/* Efek Partikel Bergerak & Saling Terhubung (tsParticles) */}
      {particlesInit && (
        <Particles
          id="tsparticles"
          className="absolute inset-0 z-0 pointer-events-none"
          options={particlesOptions}
        />
      )}

      {/* Panggil komponen senter terpisah di sini */}
      <InteractiveSpotlight />

      {/* Efek Latar Belakang Aurora Halus */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_70%,transparent_100%)]">
        <div className="absolute -top-[10%] -left-[10%] w-[70%] h-[40%] bg-white/5 blur-[120px] rounded-[100%] animate-blob transform -rotate-12" />
        <div className="absolute top-[5%] left-[30%] w-[50%] h-[30%] bg-gray-400/5 blur-[140px] rounded-[100%] animate-blob animation-delay-2000 transform rotate-12" />
        <div className="absolute -top-[5%] -right-[10%] w-[60%] h-[40%] bg-white/5 blur-[130px] rounded-[100%] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigasi Atas (Floating Professional Header) */}
      <div className="fixed top-6 inset-x-0 flex justify-center z-50 px-4 transition-all duration-300 animate-slide-up">
        <header className="w-full max-w-6xl bg-card/40 backdrop-blur-2xl border border-white/10 rounded-full h-16 flex items-center justify-between px-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex items-center gap-3 group cursor-pointer">
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Microstock Research
            </span>
          </div>
          <nav className="flex items-center gap-2">
            <Link 
              href="/login" 
              className="text-sm font-medium text-muted-foreground hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-all mr-2"
            >
              Contributor Login
            </Link>
            <Link 
              href="/login" 
              className="relative text-sm font-bold bg-white text-black px-6 py-2.5 rounded-full hover:bg-gray-200 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]"
            >
              Get Started
            </Link>
          </nav>
        </header>
      </div>

      {/* Bagian Hero (Utama) */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-48 pb-20 z-10 relative">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300 mb-8 hover:bg-white/10 transition-colors cursor-pointer backdrop-blur-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse border border-green-400"></span>
          AI Metadata Engine is Online
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-foreground max-w-5xl leading-[1.1]"
        >
          Precision AI Metadata for <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-600 drop-shadow-sm">
             Global Creators.
          </span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed"
        >
          Tingkatkan rasio konversi portofolio Anda. Analisis setiap aset dengan AI cerdas untuk menghasilkan judul SEO dan kata kunci berkinerja tinggi.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row gap-4"
        >
          <Link 
            href="/login" 
            className="group flex items-center justify-center gap-2 bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
          >
            Masuk ke Workspace 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Fitur Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mt-32 text-left relative z-20"
        >
          {/* Adobe Stock Card */}
          <div className="group relative bg-card/60 backdrop-blur-md border border-card-border p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-adobe-red/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-adobe-red/5 to-adobe-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-adobe-red to-adobe-pink transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-adobe-red/10 text-adobe-red rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-adobe-red/20 shadow-inner">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-adobe-red group-hover:to-adobe-pink transition-all">Adobe Stock Ready</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Format ekspor CSV yang 100% kompatibel dengan portal kontributor Adobe Stock, lengkap dengan tebakan ID Kategori otomatis dari AI.
              </p>
            </div>
          </div>

          {/* Canva Card */}
          <div className="group relative bg-card/60 backdrop-blur-md border border-card-border p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-canva-purple/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-canva-cyan/5 to-canva-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-canva-cyan to-canva-purple transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-canva-cyan/10 text-canva-cyan rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 border border-canva-cyan/20 shadow-inner">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-canva-cyan group-hover:to-canva-purple transition-all">Canva Optimization</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Pembuatan metadata khusus untuk review Canva Creator. Otomatis membatasi keyword maksimal (20 kata) dan format nama artist yang presisi.
              </p>
            </div>
          </div>

          {/* Secure Token Card */}
          <div className="group relative bg-card/60 backdrop-blur-md border border-card-border p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out" />
            <div className="relative z-10">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-blue-500/20 shadow-inner">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-indigo-500 transition-all">Secure Token System</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Arsitektur keamanan level enterprise dengan pemrosesan API Key di sisi server (Server Actions) dan sistem kuota token per pengguna.
              </p>
            </div>
          </div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 text-center mt-auto bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-muted-foreground" />
          <span className="font-bold text-foreground tracking-tight">Microstock Research</span>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
          © {new Date().getFullYear()} • Internal Tool Ecosystem
        </p>
      </footer>
    </div>
  );
}