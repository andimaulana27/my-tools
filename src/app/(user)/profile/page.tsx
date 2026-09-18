"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeading, QuotaMeta } from "@/components/ui/PageHeading";
import { Stamp } from "@/components/ui/Stamp";

type UserProfile = {
  username: string;
  token_balance: number;
  role: string;
  email?: string;
};

type UsageLog = {
  id: string;
  tool_name: string;
  tokens_used: number;
  created_at: string;
};

function toolLabel(name: string) {
  if (name === "adobe_stock_generator") return "Metadata (Adobe Stock)";
  if (name === "canva_generator") return "Metadata (Canva)";
  if (name === "file_naming_generator") return "Logic Naming";
  if (name === "image_generator") return "Asset Generator";
  if (name === "youtube_seo_engine") return "YouTube SEO";
  if (name === "saas_blueprint_engine") return "SaaS Blueprint";
  if (name === "video_engine_generator") return "Video Stock";
  return name;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recentLogs, setRecentLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    async function loadProfileData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, token_balance, role")
        .eq("id", authData.user.id)
        .single();

      if (profileData) {
        setProfile({
          ...profileData,
          email: authData.user.email,
        });
      }

      const { data: logsData } = await supabase
        .from("tools_usage")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false })
        .limit(15);

      if (logsData) setRecentLogs(logsData);
      setLoading(false);
    }

    loadProfileData();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Password baru dan konfirmasi tidak cocok.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password baru minimal 6 karakter.");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      if (profile?.email) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile.email,
          password: currentPassword,
        });
        if (signInError) throw new Error("Password saat ini salah.");
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setPasswordSuccess("Password berhasil diperbarui.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : "Gagal memperbarui password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (loading) {
    return <p className="py-20 text-[11px] uppercase tracking-[0.2em] text-text-faint">Loading</p>;
  }

  return (
    <div>
      <PageHeading
        stamp="Account"
        title="Profile."
        lede="Kredensial, kuota, dan jejak pemakaian engine."
        meta={<QuotaMeta value={profile?.token_balance ?? 0} />}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <section className="border border-line">
            <div className="border-b border-line px-4 py-3">
              <Stamp>Identity</Stamp>
            </div>
            <div className="divide-y divide-line text-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted">Username</span>
                <span className="text-text">@{profile?.username}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-text-muted">Role</span>
                <span className="text-[10px] uppercase tracking-[0.16em] text-text-faint">
                  {profile?.role === "super_admin" ? "Super admin" : "Contributor"}
                </span>
              </div>
            </div>
          </section>

          <section className="border border-line">
            <div className="border-b border-line px-4 py-3">
              <Stamp>Password</Stamp>
            </div>
            <form onSubmit={handleUpdatePassword} className="space-y-4 p-4">
              <div className="relative">
                <label className="field-label">Current</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-admin pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-9 text-text-faint hover:text-text"
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div>
                <label className="field-label">New</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-admin"
                />
              </div>
              <div>
                <label className="field-label">Confirm</label>
                <input
                  type={showPasswords ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-admin"
                />
              </div>
              <AnimatePresence>
                {passwordError ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-line px-3 py-2 text-sm text-text-muted"
                  >
                    {passwordError}
                  </motion.p>
                ) : null}
                {passwordSuccess ? (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-line px-3 py-2 text-sm text-accent"
                  >
                    {passwordSuccess}
                  </motion.p>
                ) : null}
              </AnimatePresence>
              <Button
                type="submit"
                variant="ghost"
                className="w-full"
                disabled={isUpdatingPassword || !currentPassword || !newPassword || !confirmPassword}
              >
                {isUpdatingPassword ? "Saving…" : "Save password"}
              </Button>
            </form>
          </section>
        </div>

        <section className="border border-line lg:col-span-7">
          <div className="border-b border-line px-4 py-3">
            <Stamp>Activity</Stamp>
          </div>
          {recentLogs.length === 0 ? (
            <p className="px-4 py-10 text-sm text-text-muted">Belum ada aktivitas.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentLogs.map((log) => (
                <li
                  key={log.id}
                  className="grid grid-cols-[1fr_auto_auto] items-baseline gap-3 px-4 py-3 text-sm"
                >
                  <span className="truncate text-text">{toolLabel(log.tool_name)}</span>
                  <span className="font-mono text-[11px] tabular-nums text-text-faint">
                    −{log.tokens_used}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-text-faint">
                    {new Date(log.created_at).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
