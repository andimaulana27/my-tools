// src/app/admin/layout.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, Settings, LogOut, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
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
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Efek Mouse Following */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 mix-blend-screen"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.03), transparent 40%)`
        }}
      />

      {/* Background Aurora Redup untuk Admin */}
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_80%,transparent_100%)]">
        <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-[100%] animate-blob" />
        <div className="absolute bottom-[20%] right-[10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[140px] rounded-[100%] animate-blob animation-delay-2000" />
      </div>

      {/* Sidebar untuk Desktop (Glassmorphism) */}
      <aside className="w-64 bg-card/40 backdrop-blur-2xl border-r border-white/10 hidden md:flex flex-col relative z-20 shadow-[8px_0_30px_rgba(0,0,0,0.5)]">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Admin Panel
            </h2>
            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-0.5">System Control</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
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

      {/* Area Konten Utama */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* Header Mobile (Glassmorphism) */}
        <div className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-card/60 backdrop-blur-xl">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            Admin Panel
          </h2>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-red-400 p-2 bg-black/40 rounded-lg border border-white/10">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Konten Halaman */}
        <div className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}