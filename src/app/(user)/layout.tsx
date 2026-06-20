// src/app/(user)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  LogOut, 
  Coins, 
  User as UserIcon,
  Loader2,
  Cpu,
  Palette,
  ShieldCheck,
  Activity,
  Zap,
  RefreshCw,
  AudioLines,
  MonitorPlay,
  Rocket,
  LayoutTemplate,
  Video // <-- Icon baru untuk Video Stock Engine
} from "lucide-react";

type UserProfile = {
  username: string;
  token_balance: number;
  role: string; 
};

// Senter interaktif yang dibuat lebih halus (Clean Dark)
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

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // --- STATE UNTUK TRACKER RPM (FREE TIER MONITOR) ---
  const [rpmTimestamps, setRpmTimestamps] = useState<number[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserProfile() {
      const { data: authData } = await supabase.auth.getUser();
      
      if (authData.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, token_balance, role") 
          .eq("id", authData.user.id)
          .single();

        if (isMounted && profileData) {
          if (profileData.role === 'admin') {
            router.push("/admin/dashboard");
            return;
          }

          setProfile({
            username: profileData.username,
            token_balance: profileData.token_balance,
            role: profileData.role,
          });
        }
      } else {
        router.push("/login");
      }
      
      if (isMounted) setLoading(false);
    }

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // --- LOGIKA EVENT LISTENER TOKEN & RPM ---
  useEffect(() => {
    const handleTokenUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ newTokenBalance: number }>;
      setProfile(prev => prev ? { ...prev, token_balance: customEvent.detail.newTokenBalance } : prev);
      
      setRpmTimestamps(prev => [...prev, Date.now()]);
    };

    window.addEventListener('tokenBalanceUpdated', handleTokenUpdate);
    return () => window.removeEventListener('tokenBalanceUpdated', handleTokenUpdate);
  }, []);

  // --- LOGIKA COOLDOWN RPM (Berjalan Setiap Detik) ---
  useEffect(() => {
    const interval = setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      setRpmTimestamps(prev => prev.filter(t => t > oneMinuteAgo));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // DAFTAR MENU UTAMA (Menambahkan Video Stock Engine)
  const menuItems = [
    { name: "Workspace", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Metadata Engine", icon: Cpu, path: "/metadata" },
    { name: "AI Image Engine", icon: Palette, path: "/image-engine" },
    { name: "Video Stock Engine", icon: Video, path: "/video-engine" }, // <-- Menu Baru
    { name: "Pro Converter", icon: RefreshCw, path: "/converter" }, 
    { name: "AI Voice Studio", icon: AudioLines, path: "/voice-studio" }, 
    { name: "YouTube SEO", icon: MonitorPlay, path: "/youtube-seo" },
    { name: "SaaS Blueprint", icon: Rocket, path: "/saas-blueprint" },
    { name: "UI/UX Engine", icon: LayoutTemplate, path: "/uiux-engine" },
  ];

  const currentRpm = rpmTimestamps.length;
  // Pewarnaan Tracker yang lebih elegan dan tidak mencolok
  const rpmColor = currentRpm >= 15 ? 'bg-rose-500' : currentRpm >= 10 ? 'bg-amber-500' : 'bg-emerald-500';
  const rpmTextColor = currentRpm >= 15 ? 'text-rose-400' : currentRpm >= 10 ? 'text-amber-400' : 'text-emerald-400';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center relative overflow-hidden">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-400 relative z-10" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-zinc-200 flex relative overflow-hidden antialiased font-sans selection:bg-white/20">
      
      {/* Latar Belakang Clean Modern - Pure Dark Mesh */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      <InteractiveSpotlight />

      {/* SIDEBAR DESKTOP */}
      <aside className="w-[280px] h-full bg-black/20 backdrop-blur-2xl border-r border-white/5 hidden md:flex flex-col relative z-20">
        
        {/* Logo/Brand Area */}
        <div className="p-7 border-b border-white/5 flex items-center gap-4 relative">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-zinc-400" />
              Microstock
            </h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Creator Panel</p>
          </div>
        </div>

        {/* User & System Status Area */}
        <div className="p-6 border-b border-white/5 flex flex-col gap-5">
          {/* User Info Minimalist */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10 shrink-0">
              <UserIcon className="w-4 h-4 text-zinc-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-zinc-200 truncate">
                @{profile?.username}
              </p>
              <p className="text-[11px] text-zinc-500 truncate font-medium uppercase tracking-wider">
                {profile?.role === 'super_admin' ? 'Super Admin' : 'Contributor'}
              </p>
            </div>
          </div>
          
          {/* Tracker Status Clean Mode */}
          <div className="bg-black/40 border border-white/5 p-4 rounded-xl space-y-4">
            {/* Token */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">RPD Quota</span>
              <span className="text-sm font-mono font-bold text-zinc-300 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-zinc-400" />
                {profile?.token_balance || 0}
              </span>
            </div>
            
            {/* RPM Progress */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] font-semibold uppercase tracking-widest">
                <span className="text-zinc-500 flex items-center gap-1.5"><Activity className="w-3 h-3"/> API Load</span>
                <span className={`font-mono ${rpmTextColor}`}>
                  {currentRpm} <span className="text-zinc-600">/ 15</span>
                </span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${rpmColor}`} 
                  style={{ width: `${Math.min((currentRpm / 15) * 100, 100)}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Menu Utama */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Menu</p>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? "bg-white/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"} transition-colors`} />
                <span className="text-sm tracking-wide">{item.name}</span>
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-white rounded-r-full" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions (Admin Panel, Profile & Logout Group) */}
        <div className="p-4 border-t border-white/5 space-y-1.5">
          <p className="px-4 mb-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Account & Admin</p>
          
          <Link
            href="/profile"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
              pathname === "/profile"
                ? "bg-white/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
            }`}
          >
            <UserIcon className={`w-4 h-4 ${pathname === "/profile" ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"}`} />
            <span className="text-sm font-medium tracking-wide">Profile & Settings</span>
          </Link>

          {profile?.role === 'super_admin' && (
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white transition-all group"
            >
              <ShieldCheck className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              <span className="text-sm font-medium tracking-wide">Admin Panel</span>
            </Link>
          )}

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
          >
            <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-rose-400 transition-colors" />
            <span className="text-sm font-medium tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        
        {/* HEADER MOBILE - Clean Mode */}
        <div className="md:hidden px-5 py-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl relative z-20">
          <h2 className="font-bold text-white flex items-center gap-2 text-lg tracking-tight">
            <Zap className="w-4 h-4 text-zinc-400" />
            Workspace
          </h2>
          <div className="flex items-center gap-2.5">
            <div className="flex flex-col items-end gap-1 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
               <span className="text-sm font-mono font-bold flex items-center gap-1.5 text-zinc-200">
                 <Coins className="w-3.5 h-3.5 text-zinc-400" />
                 {profile?.token_balance || 0}
               </span>
               <div className="flex items-center gap-1.5">
                 <Activity className={`w-3 h-3 ${rpmTextColor}`} />
                 <div className="w-10 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${rpmColor}`} style={{ width: `${Math.min((currentRpm / 15) * 100, 100)}%` }} />
                 </div>
               </div>
            </div>
            
            <Link href="/profile" className="text-zinc-400 hover:text-white p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-transparent">
               <UserIcon className="w-4 h-4" />
            </Link>

            {profile?.role === 'super_admin' && (
              <Link href="/admin/dashboard" className="text-zinc-400 hover:text-white p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-transparent">
                <ShieldCheck className="w-4 h-4" />
              </Link>
            )}
            <button onClick={handleLogout} className="text-zinc-400 hover:text-rose-400 p-2.5 bg-white/5 hover:bg-rose-500/10 rounded-lg transition-all border border-transparent">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}