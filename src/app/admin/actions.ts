// src/app/admin/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Inisialisasi Supabase menggunakan service_role_key (Akses Master/Bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// UPDATE: Tambahkan parameter role (default: "user")
export async function createNewUser(username: string, password: string, tokens: number, role: string = "user") {
  try {
    const email = `${username}@metadata.local`;
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
        token_balance: tokens,
        role: role, // Role disuntikkan di sini
      },
    });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan sistem." };
  }
}

export async function deleteAuthUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan sistem." };
  }
}

export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan sistem." };
  }
}

export async function getSystemStatus() {
  return {
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development",
  };
}

export async function getAdminUsersData() {
  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: usageData, error: usageError } = await supabaseAdmin
      .from("tools_usage")
      .select("user_id, tokens_used");

    if (profilesError) return { success: false, error: profilesError.message };
    
    if (usageError) {
      console.error("Gagal mengambil data tools_usage di admin panel:", usageError.message);
    }

    return { success: true, profiles: profiles || [], usageData: usageData || [] };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengambil data." };
  }
}

export async function updateUserToken(userId: string, newBalance: number) {
  try {
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ token_balance: newBalance })
      .eq("id", userId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal update token." };
  }
}