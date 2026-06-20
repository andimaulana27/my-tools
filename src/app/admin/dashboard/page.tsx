// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  Users, 
  Coins, 
  Activity, 
  TrendingUp, 
  Clock, 
  ShieldAlert,
  Zap,
  LayoutGrid
} from "lucide-react";

type Stats = {
  totalUsers: number;
  totalTokens: number;
  totalUsage: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTokens: 0,
    totalUsage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      // Hitung Total User
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: 'exact', head: true });

      // Hitung Total Token & Penggunaan
      const { data: profiles } = await supabase
        .from("profiles")
        .select("token_balance");
      
      const { count: usageCount } = await supabase
        .from("tools_usage")
        .select("*", { count: 'exact', head: true });

      const totalTokens = profiles?.reduce((sum, p) => sum + p.token_balance, 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalTokens: totalTokens,
        totalUsage: usageCount || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const statCards = [
    { label: "Registered Creators", value: stats.totalUsers, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Tokens in Circulation", value: stats.totalTokens, icon: Coins, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Cloud Operations", value: stats.totalUsage, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-6xl mx-auto space-y-10"
    >
      {/* Header Overview */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/5 rounded-lg border border-white/10">
              <LayoutGrid className="w-5 h-5 text-zinc-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">System Overview</h1>
          </div>
          <p className="text-zinc-500 font-medium">Monitoring real-time activity and resource distribution across <span className="text-zinc-300 font-bold">My Tools</span> ecosystem.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Network Stable</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] relative overflow-hidden group hover:bg-white/[0.04] transition-all"
          >
            <div className={`p-3 w-fit rounded-xl ${card.bg} ${card.color} mb-6 border border-white/5`}>
              <card.icon className="w-6 h-6" />
            </div>
            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{card.label}</p>
            <h2 className="text-4xl font-black text-white tracking-tighter">
              {loading ? "..." : card.value.toLocaleString()}
            </h2>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <card.icon size={80} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom Section: Quick Actions / System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-6">
          <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-3 uppercase tracking-widest">
            <Zap className="w-4 h-4 text-amber-500" />
            Maintenance & Health
          </h3>
          <div className="space-y-4">
             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white/5 rounded-lg"><Clock className="w-4 h-4 text-zinc-500"/></div>
                   <span className="text-xs font-bold text-zinc-400">Auto-Token Reset (pg_cron)</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">Active</span>
             </div>
             <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                   <div className="p-2 bg-white/5 rounded-lg"><ShieldAlert className="w-4 h-4 text-zinc-500"/></div>
                   <span className="text-xs font-bold text-zinc-400">Supabase API Security (RLS)</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20 uppercase">Locked</span>
             </div>
          </div>
        </div>

        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-4">
           <div className="p-4 bg-white/5 rounded-full border border-white/10"><TrendingUp className="w-8 h-8 text-zinc-500" /></div>
           <h3 className="text-lg font-bold text-white">Scale your Workspace</h3>
           <p className="text-xs text-zinc-500 max-w-xs font-medium">Saat ini sistem berjalan pada infrastruktur free tier yang dioptimalkan. Pantau terus penggunaan token di dashboard admin.</p>
        </div>
      </div>

    </motion.div>
  );
}