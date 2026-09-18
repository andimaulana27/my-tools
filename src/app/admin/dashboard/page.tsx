"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { Stamp } from "@/components/ui/Stamp";
import { cn } from "@/lib/cn";

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
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      const { data: profiles } = await supabase.from("profiles").select("token_balance");
      const { count: usageCount } = await supabase
        .from("tools_usage")
        .select("*", { count: "exact", head: true });

      const totalTokens = profiles?.reduce((sum, p) => sum + p.token_balance, 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalTokens,
        totalUsage: usageCount || 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const kpis = [
    { label: "Accounts", value: stats.totalUsers, href: "/admin/users" },
    { label: "Tokens in pool", value: stats.totalTokens },
    { label: "Operations", value: stats.totalUsage },
  ];

  return (
    <div>
      <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Stamp className="mb-2">Studio</Stamp>
          <DisplayTitle as="h1" className="text-3xl md:text-4xl">
            Overview.
          </DisplayTitle>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-[11px] uppercase tracking-[0.16em]">
          <Link
            href="/admin/users"
            className="text-text-muted transition-colors duration-hover hover:text-accent"
          >
            Users
          </Link>
          <Link
            href="/admin/settings"
            className="text-text-muted transition-colors duration-hover hover:text-accent"
          >
            Settings
          </Link>
        </nav>
      </header>

      <div className="overflow-hidden border border-line">
        <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-3">
          {kpis.map((kpi) => {
            const inner = (
              <>
                <p className="text-[10px] uppercase tracking-[0.16em] text-text-faint">{kpi.label}</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-text">
                  {loading ? "—" : kpi.value.toLocaleString()}
                </p>
              </>
            );
            const cls = "bg-bg px-4 py-4";
            return kpi.href ? (
              <Link
                key={kpi.label}
                href={kpi.href}
                className={cn(cls, "transition-colors duration-hover hover:bg-wash")}
              >
                {inner}
              </Link>
            ) : (
              <div key={kpi.label} className={cls}>
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="border border-line">
          <div className="border-b border-line px-4 py-3">
            <Stamp>Health</Stamp>
          </div>
          <div className="divide-y divide-line text-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-text-muted">Auto-token reset</span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-accent">Active</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-text-muted">Row level security</span>
              <span className="text-[10px] uppercase tracking-[0.16em] text-accent">Locked</span>
            </div>
          </div>
        </section>
        <section className="border border-line">
          <div className="border-b border-line px-4 py-3">
            <Stamp>Note</Stamp>
          </div>
          <p className="px-4 py-4 text-sm leading-relaxed text-text-muted">
            Sistem berjalan di infrastruktur hemat. Pantau kuota di Users, jangan biarkan
            token beredar tanpa pemakaian.
          </p>
        </section>
      </div>
    </div>
  );
}
