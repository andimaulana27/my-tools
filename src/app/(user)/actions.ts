// src/app/(user)/actions.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Inisialisasi Supabase menggunakan service_role_key (Akses Master/Bypass RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// 1. FUNGSI UNTUK GENERATOR METADATA (AUTO-FALLBACK SYSTEM)
// ------------------------------------------------------------------
export async function processMetadataWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const mode = formData.get("mode") as string;
    const configStr = formData.get("config") as string;
    
    if (!userId || !file || !configStr) throw new Error("Data tidak lengkap.");

    const config = JSON.parse(configStr);

    // CEK TOKEN USER
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

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

    // FITUR AUTO-FALLBACK MODELS UNTUK METADATA
    const modelsToTry = [
      "gemini-2.5-flash",              
      "gemini-3.1-flash-lite-preview", 
      "gemini-3-flash-preview",        
      "gemini-2.0-flash-001",          
      "gemini-2.0-flash-lite-001"      
    ];

    let aiResponseText = "";
    let isSuccess = false;
    let lastErrorMessage = "";

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName, 
          contents: [{
              role: "user",
              parts: [
                { text: promptText },
                { inlineData: { mimeType: file.type, data: base64Data } }
              ]
          }],
          config: { responseMimeType: "application/json" }
        });

        aiResponseText = response.text || "{}";
        isSuccess = true;
        break; 
      } catch (e: unknown) { 
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.warn(`Model Metadata ${modelName} gagal:`, errorMessage);
        lastErrorMessage = errorMessage;
      }
    }

    if (!isSuccess) {
      throw new Error(`Semua server model AI sedang sibuk. Terakhir: ${lastErrorMessage}`);
    }

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

    return { success: true, metadata: metadataResult, newTokenBalance };
    
  } catch (err: unknown) { 
    console.error("Metadata API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal AI." };
  }
}

// ------------------------------------------------------------------
// 2. FUNGSI UNTUK GENERATOR IMAGE BATCH (HYBRID AUTO-FALLBACK SYSTEM)
// ------------------------------------------------------------------
export async function generateImageWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const prompt = formData.get("prompt") as string;
    const ratio = formData.get("ratio") as string;
    const referenceImage = formData.get("referenceImage") as string | null;

    if (!userId || !prompt || !ratio) throw new Error("Data tidak lengkap untuk generasi gambar.");

    // CEK TOKEN USER
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    let enhancedPrompt = prompt;

    // FITUR DUAL AI: Ekstraksi DNA Gambar Referensi
    if (referenceImage) {
        try {
            const base64Data = referenceImage.split(',')[1];
            const mimeType = referenceImage.split(';')[0].split(':')[1];

            const visionResponse = await ai.models.generateContent({
                model: "gemini-2.5-flash", 
                contents: [{
                    role: "user",
                    parts: [
                        { text: "Analyze this image. Extract ONLY the core art style, coloring technique, and illustration vibe. Keep it strictly under 25 words, comma-separated. Do not describe the subject, only the aesthetic style." },
                        { inlineData: { mimeType, data: base64Data } }
                    ]
                }]
            });
            const styleDna = visionResponse.text || "";
            enhancedPrompt += `. MUST strictly adopt this exact aesthetic and color palette: ${styleDna}`;
        } catch (e: unknown) { 
            const errorMsg = e instanceof Error ? e.message : String(e);
            console.error("Gagal mengekstrak DNA referensi, mengabaikan referensi...", errorMsg);
        }
    }

    // SUNTIKAN PROMPT ENGINEERING MICROSTOCK
    const finalMasterPrompt = `
      SUBJECT & STYLE: ${enhancedPrompt}.
      QUALITY: Masterpiece, professional microstock vector style illustration, ultra-high resolution, clean and sharp vector-like edges, flawless composition, vibrant and commercial-ready.
      CONSTRAINTS: Strictly NO text, NO words, NO letters, NO watermarks, NO signatures, NO messy lines. The background MUST be pure solid white (#FFFFFF) with absolutely no gradients or shadows on the background.
    `.trim().replace(/\s+/g, ' ');

    // HYBRID FALLBACK: Kombinasi mesin Generasi Baru (Gemini) dan Mesin Klasik (Imagen)
    const imageModelsToTry = [
      "gemini-3-pro-image-preview",
      "gemini-2.5-flash-image",       // UTAMA: Mesin gambar generasi terbaru (Nano Banana), super kilat!
      "imagen-4.0-generate-001",      // CADANGAN 1: Imagen 4 Standard
      "imagen-4.0-fast-generate-001"  // CADANGAN 2: Imagen 4 Fast
    ];

    let imageBytes: string | null | undefined = null;
    let isSuccess = false;
    let lastErrorMessage = "";

    for (const imageModel of imageModelsToTry) {
        try {
            if (imageModel.startsWith("gemini")) {
                // LALUAN 1: Gemini 2.5 Flash Image menggunakan fungsi generateContent (Multimodal)
                const response = await ai.models.generateContent({
                    model: imageModel, 
                    // Sisipkan rasio ke dalam prompt karena fungsi chat tidak punya parameter rasio bawaan
                    contents: finalMasterPrompt + `\n(IMPORTANT: Render this image in a ${ratio} aspect ratio format.)`, 
                    config: {
                        responseModalities: ["IMAGE"], // Memaksa AI menjawab dengan Gambar, bukan Teks
                    }
                });
                
                // Menggali struktur JSON untuk menemukan data base64 gambar
                const parts = response.candidates?.[0]?.content?.parts;
                const imagePart = parts?.find(p => p.inlineData !== undefined);
                imageBytes = imagePart?.inlineData?.data;
                
            } else {
                // LALUAN 2: Imagen 4 menggunakan fungsi standar generateImages
                const response = await ai.models.generateImages({
                    model: imageModel, 
                    prompt: finalMasterPrompt,
                    config: {
                        numberOfImages: 1,
                        aspectRatio: ratio, 
                        outputMimeType: "image/jpeg",
                    }
                });
                imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            }

            if (!imageBytes) {
                throw new Error(`Model ${imageModel} merespons tapi tidak mengembalikan byte gambar.`);
            }

            isSuccess = true;
            break; // Jika berhasil, hentikan loop dan jangan coba model cadangan
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e);
            console.warn(`Model Gambar ${imageModel} gagal:`, errorMessage);
            lastErrorMessage = errorMessage;
            // Loop otomatis berlanjut mencoba model berikutnya
        }
    }

    if (!isSuccess || !imageBytes) {
        throw new Error(`Semua server pembuat gambar sedang sibuk. Terakhir: ${lastErrorMessage}`);
    }

    const base64Url = `data:image/jpeg;base64,${imageBytes}`;
    
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
            tool_name: 'image_generator', 
            tokens_used: 1 
        });

    return { success: true, imageUrl: base64Url, newTokenBalance };

  } catch (err: unknown) { // Strict Typing
    console.error("Gambar API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal men-generate gambar." };
  }
}