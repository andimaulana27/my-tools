// src/app/(user)/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Inisialisasi Supabase dengan akses Admin (Bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function processMetadataWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const mode = formData.get("mode") as string;
    const configStr = formData.get("config") as string;
    
    if (!userId || !file || !configStr) {
      throw new Error("Data tidak lengkap.");
    }

    const config = JSON.parse(configStr);

    // 1. CEK TOKEN USER (Server-Side Validation)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Gagal memverifikasi profil pengguna.");
    }

    if (profile.token_balance <= 0) {
      throw new Error("INSUFFICIENT_TOKENS");
    }

    // 2. PROSES GEMINI API
    // SDK @google/genai otomatis membaca process.env.GEMINI_API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Mengubah gambar menjadi base64 agar bisa dianalisis oleh Gemini Vision
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const promptText = `
      Analyze this image and generate metadata for a microstock marketplace (${mode}).
      Requirements:
      - Title Length: ${config.titleLengthMin} to ${config.titleLengthMax} characters.
      - Keywords Count: ${config.keywordsCount} comma-separated keywords.
      - Concept Context: ${config.conceptContext || 'None'}
      - Negative Keywords to avoid: ${config.negativeKeywords}
      
      Respond STRICTLY in JSON format with exactly these keys: "title", "keywords", "description", and "category" (number 1-21). Do not include markdown formatting like \`\`\`json.
    `;

    // MENGGUNAKAN MODEL GEMINI 2.5 FLASH
    // Kamu bisa menggantinya menjadi "gemini-2.5-pro" di sini jika dibutuhkan
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: promptText },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        }
      ]
    });

    const aiResponseText = response.text || "{}";
    
    // Membersihkan output dari tag markdown agar JSON valid
    const cleanJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const metadataResult = JSON.parse(cleanJson);

    // 3. POTONG TOKEN & CATAT LOG JIKA SUKSES
    const newTokenBalance = profile.token_balance - 1;

    // Update saldo token user
    await supabaseAdmin
      .from("profiles")
      .update({ token_balance: newTokenBalance })
      .eq("id", userId);

    // Catat log penggunaan untuk dilihat di Admin Dashboard
    await supabaseAdmin
      .from("tools_usage")
      .insert({
        user_id: userId,
        tool_name: mode === 'adobe' ? 'adobe_stock_generator' : 'canva_generator',
        tokens_used: 1
      });

    return { 
      success: true, 
      metadata: metadataResult,
      newTokenBalance: newTokenBalance 
    };

  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Terjadi kesalahan internal saat memproses AI." };
  }
}