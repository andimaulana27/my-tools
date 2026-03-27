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
  Sparkles
} from "lucide-react";

type UserProfile = {
  username: string;
  token_balance: number;
};

// KOMPONEN SENTER TERPISAH: Mencegah re-render seluruh halaman saat mouse bergerak
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
        background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.04), transparent 40%)`
      }}
    />
  );
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Mengambil data awal user
  useEffect(() => {
    let isMounted = true;

    async function fetchUserProfile() {
      const { data: authData } = await supabase.auth.getUser();
      
      if (authData.user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, token_balance")
          .eq("id", authData.user.id)
          .single();

        if (isMounted && profileData) {
          setProfile({
            username: profileData.username,
            token_balance: profileData.token_balance,
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

  // EVENT LISTENER: Mendengarkan sinyal update token dari halaman metadata
  useEffect(() => {
    const handleTokenUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ newTokenBalance: number }>;
      setProfile(prev => prev ? { ...prev, token_balance: customEvent.detail.newTokenBalance } : prev);
    };

    window.addEventListener('tokenBalanceUpdated', handleTokenUpdate);
    return () => window.removeEventListener('tokenBalanceUpdated', handleTokenUpdate);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "Workspace", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Metadata Engine", icon: Cpu, path: "/metadata" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15]" />
        <Loader2 className="w-10 h-10 animate-spin text-white relative z-10" />
        <p className="text-muted-foreground mt-4 font-medium relative z-10 animate-pulse">Memuat Workspace...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex relative overflow-hidden antialiased">
      
      {/* BACKGROUND MODERN GLOBAL: Faint Dot Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_20%,#000_100%)]" />
      </div>

      {/* Background Aurora Redup untuk Identitas User Workspace */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_80%,transparent_100%)]">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-canva-purple/5 blur-[120px] rounded-[100%] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-adobe-pink/5 blur-[140px] rounded-[100%] animate-blob animation-delay-2000" />
      </div>

      <InteractiveSpotlight />

      {/* Sidebar Desktop (Glassmorphism Premium) */}
      <aside className="w-[280px] h-full bg-card/40 backdrop-blur-2xl border-r border-white/10 hidden md:flex flex-col relative z-20 shadow-[8px_0_30px_rgba(0,0,0,0.5)]">
        
        <div className="p-7 border-b border-white/10 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-canva-cyan to-adobe-pink opacity-50" />
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Microstock Research
            </h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Creator Panel</p>
          </div>
        </div>

        {/* User Info & Token Balance */}
        <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl shrink-0 shadow-inner">
              <UserIcon className="w-4 h-4 text-gray-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">
                @{profile?.username}
              </p>
              <p className="text-xs text-canva-cyan truncate font-medium">Contributor</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 px-4 py-3 rounded-xl shadow-inner group transition-colors hover:border-white/20">
            <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Sisa Token</span>
            <span className="text-sm font-black text-foreground flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
              <Coins className="w-4 h-4 text-yellow-400" />
              {profile?.token_balance || 0}
            </span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? "bg-white/10 text-white font-bold border border-white/20 shadow-inner"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50" />}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "group-hover:text-gray-300"}`} />
                <span className="relative z-10 text-sm tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-5 border-t border-white/10 bg-black/20 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all group shadow-inner"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-wide">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        
        {/* Mobile Header (Glassmorphism) */}
        <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-card/60 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative z-20">
          <h2 className="font-black text-foreground flex items-center gap-2.5 tracking-tight text-lg">
            <div className="p-1.5 bg-white/10 border border-white/20 rounded-lg shadow-inner">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            Workspace
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-black flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              <Coins className="w-4 h-4 text-yellow-400" />
              {profile?.token_balance || 0}
            </span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-2.5 bg-black/40 hover:bg-red-500/10 rounded-xl border border-white/10 hover:border-red-500/30 transition-all shadow-inner">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Konten Halaman Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}