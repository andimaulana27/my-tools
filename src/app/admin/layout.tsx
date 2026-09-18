"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AppSidebar, SidebarAction } from "@/components/AppSidebar";
import { PatternPanel } from "@/components/ui/JapanPattern";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ADMIN_NAV } from "@/lib/tools";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    async function checkAdmin() {
      const { data: authData } = await supabase.auth.getUser();

      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, role")
          .eq("id", authData.user.id)
          .single();

        if (profile && (profile.role === "admin" || profile.role === "super_admin")) {
          setAdminName(profile.username);
          setRole(profile.role);
          setLoading(false);
        } else {
          router.push("/dashboard");
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
        markHref="/admin/dashboard"
        kicker="Admin"
        items={ADMIN_NAV}
        meta={
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-text-faint">Authorized</p>
            <p className="mt-1.5 text-sm text-text">@{adminName}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-text-faint">
              {role === "super_admin" ? "Super admin" : "Admin"}
            </p>
          </div>
        }
        footer={
          <>
            <ThemeToggle className="px-1 text-[11px] uppercase tracking-[0.18em] text-text-muted transition-colors duration-hover hover:text-accent" />
            <SidebarAction href="/dashboard">Back to app</SidebarAction>
            <SidebarAction onClick={handleLogout}>Log out</SidebarAction>
          </>
        }
      />
      <main className="relative flex-1 overflow-hidden md:ml-56">
        <PatternPanel motif="asanoha" className="opacity-[0.12]" />
        <div className="relative z-10 mx-auto max-w-5xl px-5 py-8 md:px-8 md:py-10">{children}</div>
      </main>
    </div>
  );
}
