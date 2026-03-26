// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Users, Coins, Activity, Loader2 } from "lucide-react";

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
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
    },
    {
      title: "API Tokens Consumed",
      value: stats.totalTokensUsed.toLocaleString(),
      icon: Coins,
      description: "Total token AI yang terpakai",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/20",
    },
    {
      title: "Active Generator Tools",
      value: stats.activeTools,
      icon: Activity,
      description: "Canva & Adobe Stock Metadata",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20",
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-8 max-w-6xl mx-auto"
    >
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Pantau aktivitas pengguna dan penggunaan kuota API sistem secara realtime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-card/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-lg hover:-translate-y-1 transition-all duration-300 hover:shadow-2xl hover:border-white/20 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.border} border group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-4xl font-black text-white mb-2 tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-3">
                    {stat.title}
                  </p>
                  <p className="text-xs text-muted-foreground font-medium border-t border-white/10 pt-3">
                    {stat.description}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      
    </motion.div>
  );
}