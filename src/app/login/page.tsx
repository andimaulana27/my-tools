"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { DisplayTitle } from "@/components/ui/DisplayTitle";
import { LoginOrnament, PatternPanel } from "@/components/ui/JapanPattern";
import { Stamp } from "@/components/ui/Stamp";
import { cn } from "@/lib/cn";
import { SITE_WRAP } from "@/lib/layout";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const dummyEmail = `${username}@microstock.com`;
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: dummyEmail,
      password,
    });

    if (signInError) {
      setError("Kredensial akses tidak valid.");
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user?.id)
      .single();

    if (profileError || !profileData) {
      setError("Gagal sinkronisasi profil.");
      setLoading(false);
      return;
    }

    if (profileData.role === "admin" || profileData.role === "super_admin") {
      router.push("/admin/dashboard");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <PatternPanel motif="seigaiha" />
      <div
        className={cn(
          SITE_WRAP,
          "relative z-10 grid min-h-screen items-center py-16 lg:grid-cols-[minmax(0,26rem)_1fr] lg:gap-10"
        )}
      >
        <div className="max-w-md">
          <Stamp className="mb-6">Access</Stamp>
          <DisplayTitle className="text-5xl md:text-6xl">Login.</DisplayTitle>
          <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-text-faint">
            Private workspace
          </p>
          <form onSubmit={handleLogin} className="mt-10 space-y-4">
            <div>
              <label className="field-label">Username</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-admin"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-admin"
                autoComplete="current-password"
              />
            </div>
            {error ? (
              <p className="border border-line px-3 py-2 text-sm text-text-muted">{error}</p>
            ) : null}
            <Button type="submit" variant="ghost" className="w-full" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-10">
            <Link
              href="/"
              className="text-[11px] uppercase tracking-[0.16em] text-text-faint hover:text-text"
            >
              Back to site →
            </Link>
          </p>
        </div>
        <LoginOrnament />
      </div>
    </main>
  );
}
