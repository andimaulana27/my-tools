// src/app/(user)/actions/uiux.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// FUNGSI GENERATE UI/UX COPY & LAYOUT (GEMINI AI)
// ------------------------------------------------------------------
export async function generateUIUXCopy(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const theme = formData.get("theme") as string;
    const tone = formData.get("tone") as string;
    const pageScope = formData.get("pageScope") as string; // 'landing_page_only' atau 'multi_page'

    if (!userId || !theme) {
        throw new Error("Tema/Niche industri wajib diisi.");
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

    // 2. Merakit Prompt untuk UX Writer & UI Architect
    const promptText = `
      Anda adalah seorang Senior UX Writer dan Lead UI/UX Designer.
      Tugas Anda adalah merancang struktur UI/UX beserta copywritingnya berdasarkan instruksi berikut:
      
      Tema/Niche Industri: "${theme}"
      Tone of Voice: "${tone || 'Profesional, Jelas, dan Terpercaya'}"
      Cakupan: "${pageScope === 'multi_page' ? 'Full Website (Multi-page mencakup Home, About, Services/Features, Contact)' : 'Hanya 1 Landing Page Utama'}"
      
      ATURAN PENTING:
      1. NAMA PERUSAHAAN FIKTIF: Ciptakan satu nama perusahaan/brand fiktif yang terdengar profesional dan sangat cocok dengan tema industri tersebut.
      2. PENGGUNAAN NAMA: Anda WAJIB menyematkan nama perusahaan fiktif tersebut ke dalam kalimat copywriting yang Anda buat (misalnya di Headline, About Us, Footer, dll).
      3. STRUKTUR: Rancang struktur dari paling atas ke bawah. WAJIB dimulai dari Header/Navbar dan diakhiri dengan Footer.
      4. KOMPONEN: Berikan komponen UI apa saja yang dibutuhkan pada tiap section (misal: Carousel, 3 Cards, Primary Button).
      5. COPYWRITING: Berikan rekomendasi COPYWRITING yang spesifik, memikat, dan siap pakai (TIDAK BOLEH MENGGUNAKAN LOREM IPSUM).
      
      WAJIB gunakan struktur JSON murni berikut tanpa markdown atau teks pengantar:
      {
        "projectTheme": "Nama tema proyek",
        "suggestedCompanyName": "Nama brand/perusahaan fiktif yang Anda ciptakan",
        "targetAudience": "Siapa audiens utamanya",
        "pages": [
          {
            "pageName": "Nama Halaman (misal: Home / Landing Page)",
            "sections": [
              {
                "sectionName": "Nama Section (misal: Header/Navbar, Hero, Footer)",
                "purpose": "Tujuan dari section ini",
                "uiComponents": [
                  "Komponen 1 (misal: Logo Kiri, Navigasi Tengah)",
                  "Komponen 2 (misal: Button CTA di Kanan)"
                ],
                "contentSuggestions": [
                  {
                    "element": "Nama elemen (misal: Main Headline atau Link Navbar)",
                    "copy": "Teks copywriting yang kuat, memikat, dan mengandung nama perusahaan fiktif jika relevan"
                  }
                ]
              }
            ]
          }
        ]
      }
      
      Respond STRICTLY in JSON format. Do not include markdown formatting like \`\`\`json.
    `;

    // 3. Eksekusi AI
    const modelsToTry = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];
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

    const uxResult = JSON.parse(cleanJson);
    
    // 5. Potong 1 Token & Catat Aktivitas Penggunaan
    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    
    await supabaseAdmin.from("tools_usage").insert({ 
        user_id: userId, 
        tool_name: 'uiux_copy_engine', 
        tokens_used: 1 
    });

    return { success: true, uxData: uxResult, newTokenBalance };
    
  } catch (err: unknown) { 
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan saat merancang UI/UX." };
  }
}