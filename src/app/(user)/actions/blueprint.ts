// src/app/(user)/actions/blueprint.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// FUNGSI GENERATE SAAS BLUEPRINT (GEMINI AI)
// ------------------------------------------------------------------
export async function generateSaaSBlueprint(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const ideaDescription = formData.get("ideaDescription") as string;
    const targetAudience = formData.get("targetAudience") as string;

    if (!userId || !ideaDescription) {
        throw new Error("Deskripsi ide SaaS wajib diisi.");
    }

    // 1. Cek Kuota Token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // 2. Merakit Prompt untuk Arsitek SaaS
    const promptText = `
      Anda adalah seorang Software Architect dan Product Manager level Senior (Staff Engineer).
      Tugas Anda adalah membedah ide aplikasi SaaS (Software as a Service) yang masih mentah menjadi Blueprint Arsitektur Teknis yang siap dikembangkan.
      
      Ide SaaS: "${ideaDescription}"
      Target Audiens (opsional): "${targetAudience || 'Pengguna umum / B2B'}"
      
      Lakukan analisis mendalam dan hasilkan blueprint teknis dengan format JSON murni.
      WAJIB gunakan struktur JSON berikut tanpa markdown, tanpa teks pengantar:
      {
        "projectName": "Beri nama proyek yang *catchy* dan modern",
        "elevatorPitch": "Penjelasan 2 kalimat yang sangat *menjual* tentang SaaS ini",
        "coreFeatures": [
          {
            "name": "Nama Fitur",
            "description": "Deskripsi teknis fitur",
            "priority": "P0 (Must Have) | P1 (Should Have) | P2 (Nice to Have)"
          }
        ],
        "databaseSchema": [
          {
            "tableName": "nama_tabel",
            "description": "Fungsi tabel ini",
            "columns": ["id (UUID)", "created_at (Timestamp)", "kolom_lain (Tipe Data)"]
          }
        ],
        "suggestedStack": [
          {
            "category": "Frontend | Backend | Database | AI/3rd Party",
            "technology": "Nama Teknologi (misal: Next.js, Supabase, Stripe)",
            "reason": "Alasan pemilihan teknologi ini"
          }
        ]
      }
      
      Respond STRICTLY in JSON format. Do not include markdown formatting like \`\`\`json.
    `;

    // 3. Eksekusi AI (Fallback Models)
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let aiResponseText = "";
    let isSuccess = false;
    let lastErrorMessage = "";

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName, 
          contents: [{ role: "user", parts: [{ text: promptText }] }],
          config: { responseMimeType: "application/json" }
        });
        aiResponseText = response.text || "{}";
        isSuccess = true;
        break; 
      } catch (err: unknown) { 
        lastErrorMessage = err instanceof Error ? err.message : String(err);
      }
    }

    if (!isSuccess) throw new Error(`Server AI sedang sibuk. Terakhir: ${lastErrorMessage}`);

    // 4. Pembersihan dan Parsing JSON
    let cleanJson = aiResponseText;
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    } else {
      cleanJson = cleanJson.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const blueprintResult = JSON.parse(cleanJson);
    
    // 5. Potong 1 Token & Catat Aktivitas Penggunaan
    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    
    // Mencatat ke tabel tools_usage agar tampil di dashboard
    await supabaseAdmin.from("tools_usage").insert({ 
        user_id: userId, 
        tool_name: 'saas_blueprint_engine', 
        tokens_used: 1 
    });

    return { success: true, blueprint: blueprintResult, newTokenBalance };
    
  } catch (err: unknown) { 
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan saat merakit Blueprint." };
  }
}