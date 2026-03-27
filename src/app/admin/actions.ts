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

export async function createNewUser(username: string, password: string, tokens: number) {
  try {
    const email = `${username}@metadata.local`;

    // Menggunakan auth.admin.createUser agar tidak mengganggu sesi login Admin yang sedang aktif
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        username: username,
        token_balance: tokens,
        role: "user",
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Terjadi kesalahan sistem yang tidak diketahui." };
  }
}

export async function deleteAuthUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Terjadi kesalahan sistem yang tidak diketahui." };
  }
}

// FUNGSI BARU: Reset Password oleh Admin tanpa memerlukan sandi lama
export async function updateUserPassword(userId: string, newPassword: string) {
  try {
    // HAPUS 'data,' dari sini, cukup ambil 'error'
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Terjadi kesalahan sistem yang tidak diketahui." };
  }
}

// Cek status sistem dan environment variable (berjalan aman di server)
export async function getSystemStatus() {
  return {
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    nodeEnv: process.env.NODE_ENV || "development",
  };
}