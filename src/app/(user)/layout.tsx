// src/app/(user)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  Sparkles, 
  LogOut, 
  Coins, 
  User as UserIcon,
  Loader2,
  Cpu
} from "lucide-react";

type UserProfile = {
  username: string;
  token_balance: number;
};

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Efek Senter Interaktif (Mouse Follower) untuk konsistensi tema
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Metadata Generator", icon: Cpu, path: "/metadata" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-canva-purple/10 to-adobe-pink/10 blur-[100px] animate-pulse" />
        <Loader2 className="w-10 h-10 animate-spin text-white relative z-10" />
        <p className="text-muted-foreground mt-4 font-medium relative z-10 animate-pulse">Memuat Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      
      {/* Efek Mouse Following */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 mix-blend-screen"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 40%)`
        }}
      />

      {/* Background Aurora Redup untuk Workspace */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_80%,transparent_100%)]">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-canva-purple/5 blur-[120px] rounded-[100%] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-adobe-pink/5 blur-[140px] rounded-[100%] animate-blob animation-delay-2000" />
      </div>

      {/* Sidebar Desktop (Glassmorphism) */}
      <aside className="w-64 bg-card/40 backdrop-blur-2xl border-r border-white/10 hidden md:flex flex-col relative z-20 shadow-[8px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              MIcrostock Research
            </h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">AI Assistant</p>
          </div>
        </div>

        {/* User Info & Token Balance */}
        <div className="p-5 border-b border-white/10 bg-white/5 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-full shrink-0 shadow-inner">
              <UserIcon className="w-4 h-4 text-gray-300" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-foreground truncate">
                @{profile?.username}
              </p>
              <p className="text-xs text-canva-cyan truncate font-medium">Contributor</p>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/40 border border-white/10 px-4 py-2.5 rounded-xl shadow-inner group">
            <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-300 transition-colors">Sisa Token</span>
            <span className="text-sm font-black text-foreground flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]">
              <Coins className="w-4 h-4 text-yellow-400" />
              {profile?.token_balance || 0}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                  isActive
                    ? "bg-white/10 text-white font-bold shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white hover:translate-x-1 border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "group-hover:text-gray-300"}`} />
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 border border-transparent transition-all group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header (Glassmorphism) */}
        <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-card/60 backdrop-blur-xl">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <div className="p-1.5 bg-white rounded-lg">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            MetaGen
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
              <Coins className="w-4 h-4 text-yellow-400" />
              {profile?.token_balance || 0}
            </span>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 p-2 bg-black/40 rounded-lg border border-white/10">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Konten Halaman */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}