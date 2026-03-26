// src/app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Loader2, Lock, User, Sparkles } from "lucide-react";

// Variabel Konfigurasi untuk Elemen Latar Belakang Melayang
const floatingShapes = [
  { id: 1, type: "triangle", size: "w-24 h-24", color: "from-canva-purple/10 to-transparent", x: "10%", y: "20%", delay: 0, duration: 25 },
  { id: 2, type: "circle", size: "w-32 h-32", color: "from-adobe-pink/10 via-transparent to-transparent", x: "80%", y: "15%", delay: 2, duration: 30 },
  { id: 3, type: "hexagon", size: "w-40 h-40", color: "from-canva-cyan/10 to-transparent", x: "75%", y: "70%", delay: 1, duration: 28 },
  { id: 4, type: "triangle", size: "w-20 h-20", color: "from-adobe-red/10 to-transparent", x: "20%", y: "80%", delay: 4, duration: 22 },
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Efek Senter Interaktif (Mouse Follower)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  // Komponen Helper untuk menggambar bentuk geometris samar
  const RenderShape = ({ type, color, size }: { type: string; color: string; size: string }) => {
    const baseClass = `absolute bg-gradient-to-br ${color} ${size} opacity-10 blur-[2px]`;
    if (type === "circle") return <div className={`${baseClass} rounded-full`} />;
    if (type === "triangle") return <div className={`${baseClass}`} style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />;
    if (type === "hexagon") return <div className={`${baseClass}`} style={{ clipPath: "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)" }} />;
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background p-4 antialiased">
      
      {/* Efek Mouse Following (Senter Interaktif) */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 mix-blend-screen"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.04), transparent 40%)`
        }}
      />

      {/* 1. Efek Latar Belakang Colorful Aurora (Diperbarui opacitynya) */}
      <div className="absolute inset-0 overflow-hidden -z-20 pointer-events-none bg-background [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_80%,transparent_100%)]">
        <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[50%] bg-canva-purple/10 blur-[130px] rounded-[100%] animate-blob transform -rotate-12" />
        <div className="absolute top-[20%] left-[30%] w-[50%] h-[40%] bg-adobe-pink/10 blur-[150px] rounded-[100%] animate-blob animation-delay-2000 transform rotate-12" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[50%] bg-canva-cyan/10 blur-[140px] rounded-[100%] animate-blob" style={{ animationDelay: '4s' }} />
      </div>

      {/* 2. BARU: Elemen Geometris Melayang Samak di Latar Belakang (Mengisi Ruang Kosong) */}
      <div className="absolute inset-0 overflow-hidden -z-10 pointer-events-none">
        {floatingShapes.map((shape) => (
          <motion.div
            key={shape.id}
            className="absolute"
            style={{ left: shape.x, top: shape.y }}
            initial={{ opacity: 0, scale: 0.8, rotate: 0 }}
            animate={{ 
              opacity: [0, 0.5, 0], 
              scale: [0.8, 1.1, 0.8],
              rotate: [0, 180, 360],
              x: ["0px", "40px", "-20px", "0px"],
              y: ["0px", "-50px", "30px", "0px"]
            }}
            transition={{ 
              duration: shape.duration, 
              delay: shape.delay, 
              repeat: Infinity, 
              ease: "linear" 
            }}
          >
            <RenderShape type={shape.type} color={shape.color} size={shape.size} />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} // Custom ease-out expo
        className="w-full max-w-md relative z-10"
      >

        {/* Card Glassmorphism */}
        <div className="bg-card/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 pt-12 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden group">
          
          {/* BARU: Garis Gradient Halus di Atas Card dengan Efek Berdenyut (Pulse) */}
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
                whileFocus={{ scale: 1.02 }} // BARU: Animasi Scaling saat Fokus
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
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
                whileFocus={{ scale: 1.02 }} // BARU: Animasi Scaling saat Fokus
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
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-gray-600 focus:outline-none focus:border-white/30 focus:bg-black/60 focus:ring-1 focus:ring-white/20 transition-all shadow-inner"
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
              whileHover={{ scale: 1.01, transition: { duration: 0.2 } }} // BARU: Hover Scale halus
              whileTap={{ scale: 0.98 }} // BARU: Efek Membal saat Diklik
            >
              {/* BARU: Efek Shimmer Kilauan saat Hover */}
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
          <div className="mt-8 text-center border-t border-white/5 pt-6">
            <p className="text-xs text-gray-600 uppercase tracking-widest font-bold">
              Internal Access Only
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}