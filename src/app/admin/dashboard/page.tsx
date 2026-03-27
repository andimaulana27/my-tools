// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Users, Coins, Activity, Loader2, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTokensUsed: 0,
    activeTools: 2, 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("role", "user");

      const { data: usageData } = await supabase
        .from("tools_usage")
        .select("tokens_used");

      const totalTokens = usageData?.reduce((acc, curr) => acc + curr.tokens_used, 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalTokensUsed: totalTokens,
        activeTools: 2,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Registered Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Pengguna aktif dalam sistem",
      color: "text-blue-400",
      bgGlow: "bg-blue-500/10",
      border: "border-blue-500/20",
      gradient: "from-blue-500 to-cyan-400"
    },
    {
      title: "API Tokens Consumed",
      value: stats.totalTokensUsed.toLocaleString(),
      icon: Coins,
      description: "Total token AI yang terpakai",
      color: "text-yellow-400",
      bgGlow: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      gradient: "from-yellow-400 to-orange-400"
    },
    {
      title: "Active Generator Tools",
      value: stats.activeTools,
      icon: Activity,
      description: "Canva & Adobe Stock Metadata",
      color: "text-emerald-400",
      bgGlow: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      gradient: "from-emerald-400 to-teal-400"
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-10 h-10 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative min-h-full">
      
      {/* 1. BACKGROUND DASHBOARD MODERN: Faint Dot Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Pola titik-titik abu-abu sangat transparan */}
        <div className="absolute inset-0 bg-[radial-gradient(#4b5563_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.15]" />
        {/* Masking agar titik-titik hanya terlihat di tengah dan memudar di ujung */}
        <div className="absolute inset-0 bg-background [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,transparent_20%,#000_100%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 space-y-8 max-w-6xl mx-auto"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
              System Overview
              <span className="flex h-3 w-3 relative ml-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
              </span>
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">
              Pantau aktivitas pengguna dan penggunaan kuota API sistem secara realtime.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-bold text-gray-300">Live Status: <span className="text-green-400">Optimal</span></span>
          </div>
        </div>

        {/* Stats Grid Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-card/60 backdrop-blur-xl border border-white/10 p-7 rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_15px_40px_rgba(0,0,0,0.4)] hover:border-white/20 overflow-hidden"
              >
                {/* Efek kilauan diagonal saat dihover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Garis aksen tipis di atas kartu */}
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.gradient} opacity-50 group-hover:opacity-100 transition-opacity`} />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-3.5 rounded-2xl ${stat.bgGlow} ${stat.border} border shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 relative`}>
                      <Icon className={`w-6 h-6 ${stat.color} relative z-10`} />
                      {/* Ambient glow di belakang ikon */}
                      <div className={`absolute inset-0 ${stat.bgGlow} blur-md rounded-2xl`} />
                    </div>
                  </div>
                  <div>
                    <h3 className={`text-4xl font-black mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${stat.gradient} drop-shadow-sm`}>
                      {stat.value}
                    </h3>
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                      {stat.title}
                    </p>
                    <p className="text-xs text-muted-foreground font-medium border-t border-white/10 pt-4 mt-2">
                      {stat.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}