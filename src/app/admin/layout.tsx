// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  LayoutDashboard, 
  LogOut, 
  Users, 
  Settings,
  Loader2,
  Command,
  ShieldCheck,
  Zap,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

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

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const { data: authData } = await supabase.auth.getUser();
      
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("id", authData.user.id)
          .single();

        if (profile && (profile.role === 'admin' || profile.role === 'super_admin')) {
          setAdminName(profile.username);
          setLoading(false);
        } else {
          router.push("/dashboard"); // Tendang ke user dashboard jika bukan admin
        }
      } else {
        router.push("/login");
      }
    }
    checkAdmin();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const adminMenu = [
    { name: "Overview", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "User Management", icon: Users, path: "/admin/users" },
    { name: "System Settings", icon: Settings, path: "/admin/settings" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#050505] text-zinc-200 flex relative overflow-hidden antialiased font-sans">
      
      {/* Background Layer: Animated Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] animate-grid opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050505]/80 to-[#050505]" />
      </div>

      <InteractiveSpotlight />

      {/* SIDEBAR ADMIN */}
      <aside className="w-[280px] h-full bg-black/20 backdrop-blur-3xl border-r border-white/5 hidden md:flex flex-col relative z-20">
        
        <div className="p-7 border-b border-white/5 flex items-center gap-3">
          <div className="p-1.5 bg-white/5 rounded-md border border-white/10">
            <Command className="w-4 h-4 text-zinc-300" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-widest uppercase">
              My Tools
            </h2>
            <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black mt-0.5">Admin Central</p>
          </div>
        </div>

        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-1">
            <ShieldCheck className="w-4 h-4 text-zinc-400" />
            <span className="text-xs font-bold text-zinc-200">System Authorized</span>
          </div>
          <p className="text-[11px] text-zinc-500 font-medium">Logged in as <span className="text-zinc-300">@{adminName}</span></p>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          <p className="px-4 mb-3 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Management</p>
          {adminMenu.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? "bg-white/10 text-white font-bold border border-white/10"
                    : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3 h-3 text-white" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-zinc-500 hover:bg-white/5 hover:text-zinc-200 transition-all group border border-transparent"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-xs font-bold uppercase tracking-wider">Back to App</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all group"
          >
            <LogOut className="w-4 h-4 transition-transform group-hover:scale-110" />
            <span className="text-xs font-bold uppercase tracking-wider">Terminate Session</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        {/* Mobile Header Admin */}
        <div className="md:hidden px-5 py-4 border-b border-white/5 flex justify-between items-center bg-black/40 backdrop-blur-xl relative z-20">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-zinc-400" />
            <span className="font-bold text-white text-sm uppercase tracking-widest">Admin</span>
          </div>
          <button onClick={handleLogout} className="text-zinc-500 hover:text-rose-400 p-2 bg-white/5 rounded-lg border border-white/10">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-10 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}