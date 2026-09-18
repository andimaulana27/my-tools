"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppSidebar, SidebarAction } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { USER_NAV } from "@/lib/tools";

type UserProfile = {
  username: string;
  token_balance: number;
  role: string;
};

export default function UserLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
          if (profileData.role === "admin") {
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

  useEffect(() => {
    const handleTokenUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ newTokenBalance: number }>;
      setProfile((prev) =>
        prev ? { ...prev, token_balance: customEvent.detail.newTokenBalance } : prev
      );
      setRpmTimestamps((prev) => [...prev, Date.now()]);
    };

    window.addEventListener("tokenBalanceUpdated", handleTokenUpdate);
    return () => window.removeEventListener("tokenBalanceUpdated", handleTokenUpdate);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const oneMinuteAgo = Date.now() - 60000;
      setRpmTimestamps((prev) => prev.filter((t) => t > oneMinuteAgo));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const currentRpm = rpmTimestamps.length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-[11px] uppercase tracking-[0.2em] text-text-faint">
        Loading
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text md:flex">
      <AppSidebar
        markHref="/dashboard"
        kicker="Workspace"
        items={USER_NAV}
        meta={
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-text-faint">Account</p>
              <p className="mt-1.5 text-sm text-text">@{profile?.username}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-faint">Quota</p>
                <p className="mt-1.5 font-mono text-sm tabular-nums text-text">
                  {profile?.token_balance ?? 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-text-faint">Load</p>
                <p className="mt-1.5 font-mono text-sm tabular-nums text-text">
                  {currentRpm}
                  <span className="text-text-faint"> / 15</span>
                </p>
              </div>
            </div>
          </div>
        }
        footer={
          <>
            <ThemeToggle className="px-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors duration-hover hover:text-accent" />
            <SidebarAction href="/profile">Profile</SidebarAction>
            {profile?.role === "super_admin" ? (
              <SidebarAction href="/admin/dashboard">Admin</SidebarAction>
            ) : null}
            <SidebarAction onClick={handleLogout}>Log out</SidebarAction>
          </>
        }
      />
      <main className="flex-1 md:ml-56">
        <div className="mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
