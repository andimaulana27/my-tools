// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

// KOMPONEN SENTER TERPISAH (Agar tidak me-render ulang seluruh layout & children)
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { name: "User Management", icon: Users, path: "/admin/users" },
    { name: "API Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    // PERBAIKAN: Menggunakan h-screen agar layout terkunci sebesar layar, mencegah sidebar ikut tertarik ke bawah
    <div className="h-screen bg-background flex relative overflow-hidden antialiased">
      
      {/* BACKGROUND MODERN DASHBOARD GLOBAL: Faint Dot Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15]" />
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,transparent_20%,#000_100%)]" />
      </div>

      <InteractiveSpotlight />

      {/* Sidebar untuk Desktop (Glassmorphism Premium) */}
      <aside className="w-[280px] h-full bg-card/40 backdrop-blur-2xl border-r border-white/10 hidden md:flex flex-col relative z-20 shadow-[8px_0_30px_rgba(0,0,0,0.5)]">
        
        <div className="p-7 border-b border-white/10 flex items-center gap-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-400 opacity-50" />
          <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] group-hover:scale-105 transition-transform duration-300 relative">
            <ShieldCheck className="w-6 h-6 text-white relative z-10" />
            <div className="absolute inset-0 bg-blue-400 blur-md rounded-xl opacity-50" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Admin Panel
            </h2>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
              System Control
            </p>
          </div>
        </div>

        {/* Navigasi Utama */}
        <nav className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive
                    ? "bg-blue-500/10 text-white font-bold border border-blue-500/30 shadow-inner"
                    : "text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10"
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50" />}
                <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "group-hover:text-gray-300"}`} />
                <span className="relative z-10 text-sm tracking-wide">{item.name}</span>
                {isActive && <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar (Logout tidak akan turun tertutup konten lagi) */}
        <div className="p-5 border-t border-white/10 bg-black/20 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full rounded-2xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent transition-all group shadow-inner"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold text-sm tracking-wide">Secure Logout</span>
          </button>
        </div>
      </aside>

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative z-10">
        
        {/* Header Mobile */}
        <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-card/60 backdrop-blur-2xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] relative z-20">
          <h2 className="font-black text-foreground flex items-center gap-2.5 tracking-tight text-lg">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-inner">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            Admin Panel
          </h2>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-2.5 bg-black/40 hover:bg-red-500/10 rounded-xl border border-white/10 hover:border-red-500/30 transition-all shadow-inner">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        
        {/* PERBAIKAN: Konten Halaman Dibuat Scrollable (hanya area ini yang bisa di-scroll) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
          {children}
        </div>
      </main>
    </div>
  );
}