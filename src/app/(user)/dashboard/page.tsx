"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CaseRow } from "@/components/ui/CaseRow";
import { PageHeading, QuotaMeta } from "@/components/ui/PageHeading";
import { TOOLS } from "@/lib/tools";

type UserProfile = {
  username: string;
  token_balance: number;
};

export default function UserDashboard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, token_balance")
        .eq("id", authData.user.id)
        .single();

      if (profileData) setProfile(profileData);
      setLoading(false);
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <p className="py-20 text-[11px] uppercase tracking-[0.2em] text-text-faint">Loading</p>
    );
  }

  return (
    <div>
      <PageHeading
        stamp="Workspace"
        title={`${profile?.username || "Studio"}.`}
        lede="Pilih engine untuk hari ini. Setiap generate memakai satu kuota."
        meta={<QuotaMeta value={profile?.token_balance ?? 0} />}
      />
      <div>
        {TOOLS.map((tool) => (
          <CaseRow
            key={tool.href}
            index={tool.index}
            title={tool.title}
            kicker={tool.kicker}
            summary={tool.summary}
            extra={tool.extra}
            href={tool.href}
          />
        ))}
      </div>
    </div>
  );
}
