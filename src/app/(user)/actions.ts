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

// ------------------------------------------------------------------
// 1. FUNGSI UNTUK GENERATOR METADATA (ADOBE / CANVA)
// ------------------------------------------------------------------
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

    // CEK TOKEN USER (Server-Side Validation)
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

    // PROSES GEMINI API
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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
    const cleanJson = aiResponseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const metadataResult = JSON.parse(cleanJson);

    // POTONG TOKEN & CATAT LOG
    const newTokenBalance = profile.token_balance - 1;

    await supabaseAdmin
      .from("profiles")
      .update({ token_balance: newTokenBalance })
      .eq("id", userId);

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

// ------------------------------------------------------------------
// 2. FUNGSI UNTUK GENERATOR IMAGE BATCH (FITUR BARU)
// ------------------------------------------------------------------

// Tipe data ketat untuk bagian konten Gemini (menghindari penggunaan 'any')
type GeminiContentPart = 
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export async function generateImageWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const prompt = formData.get("prompt") as string;
    const ratio = formData.get("ratio") as string;
    const referenceImage = formData.get("referenceImage") as string | null;

    if (!userId || !prompt || !ratio) {
      throw new Error("Data tidak lengkap untuk generasi gambar.");
    }

    // CEK TOKEN USER (Server-Side Validation)
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

    // PROSES GEMINI API IMAGE GENERATION
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Menggunakan tipe data ketat yang telah didefinisikan
    const parts: GeminiContentPart[] = [];

    // Jika ada gambar referensi (Img2Img)
    if (referenceImage) {
      const matches = referenceImage.match(/^data:(.+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2]
          }
        });
      }
    }

    // Memasukkan teks prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Model khusus image generation
      contents: { parts },
      config: {
        imageConfig: { aspectRatio: ratio }
      }
    });

    let base64Url = "";
    const responseParts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of responseParts) {
      if (part.inlineData) {
        base64Url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!base64Url) {
      throw new Error("AI tidak mengembalikan data gambar.");
    }

    // POTONG TOKEN & CATAT LOG (1 Gambar = 1 Token)
    const newTokenBalance = profile.token_balance - 1;

    await supabaseAdmin
      .from("profiles")
      .update({ token_balance: newTokenBalance })
      .eq("id", userId);

    await supabaseAdmin
      .from("tools_usage")
      .insert({
        user_id: userId,
        tool_name: 'image_generator',
        tokens_used: 1
      });

    return { 
      success: true, 
      imageUrl: base64Url,
      newTokenBalance: newTokenBalance 
    };

  } catch (err: unknown) {
    if (err instanceof Error) {
      return { success: false, error: err.message };
    }
    return { success: false, error: "Terjadi kesalahan internal saat men-generate gambar." };
  }
}