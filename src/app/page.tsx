// src/app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Image as ImageIcon, Command, FileCode } from "lucide-react";
import { motion } from "framer-motion";

// --- KOMPONEN ANIMASI BACKGROUND 1: AMBIENT GLOW (AURORA) ---
const AmbientGlow = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          x: [0, 80, -80, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[50vw] h-[50vw] bg-zinc-800/10 blur-[120px] rounded-full mix-blend-screen opacity-50"
      />
      <motion.div
        animate={{
          x: [0, -80, 80, 0],
          y: [0, 40, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-[60vw] h-[60vw] bg-blue-950/10 blur-[150px] rounded-full mix-blend-screen opacity-30"
      />
    </div>
  );
};

// --- KOMPONEN ANIMASI BACKGROUND 2: SENTER INTERAKTIF ---
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
        background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.02), transparent 40%)`
      }}
    />
  );
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#050505] text-zinc-200 font-sans">
      
      {/* BACKGROUND LAYER 1: ANIMATED DOT MESH */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Layer Dot Mesh yang bergerak (Class animate-grid ada di globals.css) */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] animate-grid opacity-80" />
        {/* Gradien penutup agar grid tidak terlalu kaku */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      {/* BACKGROUND LAYER 2: AMBIENT GLOW & SPOTLIGHT */}
      <AmbientGlow />
      <InteractiveSpotlight />

      {/* HEADER (Floating Minimalist) */}
      <div className="fixed top-6 inset-x-0 flex justify-center z-50 px-4">
        <header className="w-full max-w-5xl bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-2xl h-14 flex items-center justify-between px-5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="p-1.5 bg-white/5 rounded-md border border-white/10 group-hover:bg-white/10 transition-colors">
              <Command className="w-4 h-4 text-zinc-300" />
            </div>
            <span className="font-bold text-sm tracking-wide text-zinc-100 uppercase">
              My Tools
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="relative text-[11px] font-bold bg-zinc-100 text-black px-4 py-2 rounded-lg hover:bg-white transition-all active:scale-95 shadow-lg"
            >
              Enter Workspace
            </Link>
          </nav>
        </header>
      </div>

      {/* HERO SECTION */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-40 pb-20 z-10 relative">
        

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600 max-w-5xl leading-[0.95] mb-6"
        >
          Streamline your <br className="hidden md:block" /> creation cycle.
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-zinc-500 max-w-2xl font-medium leading-relaxed"
        >
          Platform utilitas pribadi dengan kecerdasan AI. Optimasi metadata, automasi penamaan aset, dan generator gambar cerdas dalam satu antarmuka minimalis.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <Link 
            href="/login" 
            className="group flex items-center justify-center gap-2 bg-zinc-100 text-black px-8 py-4 rounded-xl font-bold text-sm hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
          >
            Launch System 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* FEATURE CARDS (Sleek & Minimal) */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-5xl mt-32 text-left"
        >
          {/* Metadata Card */}
          <div className="group bg-white/[0.01] border border-white/5 p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.03] hover:border-white/10">
            <div className="w-10 h-10 bg-white/5 text-zinc-400 rounded-lg flex items-center justify-center mb-6 border border-white/5 transition-colors group-hover:text-white">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-3">AI Metadata</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Analisis visual instan untuk Adobe Stock & Canva. Menghasilkan judul SEO dan kata kunci volume tinggi.
            </p>
          </div>

          {/* Generator Card */}
          <div className="group bg-white/[0.01] border border-white/5 p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.03] hover:border-white/10">
            <div className="w-10 h-10 bg-white/5 text-zinc-400 rounded-lg flex items-center justify-center mb-6 border border-white/5 transition-colors group-hover:text-white">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-3">Asset Engine</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Sistem generasi &quot;Sticker Sheet&quot; massal. Maksimalkan kuota API dengan hasil variasi dalam satu kanvas.
            </p>
          </div>

          {/* Naming Card */}
          <div className="group bg-white/[0.01] border border-white/5 p-8 rounded-2xl transition-all duration-300 hover:bg-white/[0.03] hover:border-white/10">
            <div className="w-10 h-10 bg-white/5 text-zinc-400 rounded-lg flex items-center justify-center mb-6 border border-white/5 transition-colors group-hover:text-white">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-zinc-100 uppercase tracking-widest mb-3">Logic Naming</h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-medium">
              Automasi penamaan folder (kebab-case) dan master file (snake_case) terstruktur untuk arsip profesional.
            </p>
          </div>
        </motion.div>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 py-10 text-center mt-auto">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Command className="w-3.5 h-3.5 text-zinc-600" />
          <span className="font-bold text-zinc-500 text-[11px] tracking-[0.3em] uppercase">My Tools</span>
        </div>
        <p className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">
          Secure Personal Environment • {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}