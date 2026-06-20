// src/app/(user)/actions/youtube.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// 1. FUNGSI GENERATE YOUTUBE SEO METADATA (GEMINI AI)
// ------------------------------------------------------------------
export async function generateYouTubeSEO(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const gameName = formData.get("gameName") as string;
    const platform = formData.get("platform") as string;
    const vibe = formData.get("vibe") as string;
    const templateData = formData.get("templateData") as string | null;
    
    // Fitur Continuity Progress
    const currentProgress = formData.get("currentProgress") as string | null;

    if (!userId || !gameName || !platform) throw new Error("Data game dan platform wajib diisi.");

    // Cek Token
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    // Cek riwayat live game ini sebelumnya (Memory Episode)
    const { data: lastHistory } = await supabaseAdmin
      .from("youtube_history")
      .select("episode_number, last_title, last_progress")
      .eq("user_id", userId)
      .ilike("game_name", gameName)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const nextEpisode = lastHistory ? lastHistory.episode_number + 1 : 1;
    
    // Suntikkan konteks cerita sebelumnya dari database ke AI
    const historyContext = lastHistory 
      ? `\nINFO EPISODE SEBELUMNYA: Ini adalah Part ${nextEpisode} dari seri game ini. Judul live sebelumnya adalah "${lastHistory.last_title}". ${lastHistory.last_progress ? `Cerita/Progres di episode lalu: "${lastHistory.last_progress}".` : ''} Buat judul yang terasa seperti sekuel epik atau kelanjutannya (WAJIB menambahkan "Part ${nextEpisode}" atau "Ep.${nextEpisode}").` 
      : `\nINFO EPISODE: Ini adalah Part 1 (Awal mula) dari seri game ini. Buat judul yang menarik untuk menarik penonton baru.`;

    // Suntikkan progres/cerita hari ini spesifik ke AI
    const progressContext = currentProgress 
      ? `\nPROGRES SAAT INI (SANGAT PENTING): "${currentProgress}". Jadikan kejadian/progres ini sebagai HOOK utama pada judul dan paragraf pertama deskripsi agar sangat akurat dengan apa yang dimainkan!` 
      : "";

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Merakit Prompt
    const promptText = `
      Anda adalah pakar SEO YouTube khusus untuk niche Live Streaming Game.
      Tugas Anda adalah membuat metadata SEO untuk live stream game berikut:
      - Judul Game: ${gameName}
      - Platform: ${platform}
      - Nuansa/Vibe Live: ${vibe || 'Santai, Nostalgia, Interaktif'}
      ${historyContext}
      ${progressContext}
      
      ${templateData ? `PENTING: Pengguna memiliki gaya bahasa khas (Template). Anda WAJIB meniru struktur, gaya bahasa, dan format dari referensi berikut untuk judul dan deskripsinya:\n"""${templateData}"""\n` : ''}
      
      Persyaratan Output:
      1. "title": Buat judul YouTube yang menarik, clickbait tapi tidak murahan, mengundang klik penonton. Maksimal 70 karakter.
      2. "description": Buat deskripsi live stream yang asik, interaktif, dan informatif yang menyambung dengan cerita gamenya. WAJIB sertakan 3-5 hashtag relevan di akhir.
      3. "tags": Berikan 15-20 tag yang dipisahkan koma, kombinasi dari tag luas (gaming, live indonesia) dan spesifik (nama game, progres, platform).
      
      Respond STRICTLY in JSON format with exactly these keys: "title", "description", and "tags". Do not include markdown formatting like \`\`\`json.
    `;

    const modelsToTry = ["gemini-3-flash-preview","gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite"];
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

    let cleanJson = aiResponseText;
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    } else {
      cleanJson = cleanJson.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const metadataResult = JSON.parse(cleanJson);
    
    // Simpan History beserta progress saat ini untuk di-load di stream berikutnya
    await supabaseAdmin.from("youtube_history").insert({
      user_id: userId,
      game_name: gameName,
      last_title: metadataResult.title,
      last_description: metadataResult.description,
      last_progress: currentProgress || "", 
      episode_number: nextEpisode
    });

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'youtube_seo_engine', tokens_used: 1 });

    return { success: true, metadata: metadataResult, newTokenBalance, episode: nextEpisode };
    
  } catch (err: unknown) { 
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal AI." };
  }
}

// ------------------------------------------------------------------
// 2. FUNGSI UNTUK MENGAMBIL TEMPLATE MILIK USER
// ------------------------------------------------------------------
export async function getYouTubeTemplates(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('youtube_templates')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return { success: true, templates: data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengambil template." };
  }
}

// ------------------------------------------------------------------
// 3. FUNGSI UNTUK MENYIMPAN TEMPLATE BARU
// ------------------------------------------------------------------
export async function saveYouTubeTemplate(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const templateName = formData.get("templateName") as string;
    const titleFormat = formData.get("titleFormat") as string;
    const descriptionFormat = formData.get("descriptionFormat") as string;

    if (!userId || !templateName || !titleFormat || !descriptionFormat) {
        throw new Error("Semua field template wajib diisi.");
    }

    const { data, error } = await supabaseAdmin
      .from('youtube_templates')
      .insert([
        { 
            user_id: userId, 
            template_name: templateName, 
            title_format: titleFormat, 
            description_format: descriptionFormat 
        }
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { success: true, template: data };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan template." };
  }
}

// ------------------------------------------------------------------
// 4. FUNGSI MENGHAPUS TEMPLATE
// ------------------------------------------------------------------
export async function deleteYouTubeTemplate(templateId: string, userId: string) {
  try {
    const { error } = await supabaseAdmin
      .from('youtube_templates')
      .delete()
      .eq('id', templateId)
      .eq('user_id', userId); 

    if (error) throw new Error(error.message);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghapus template." };
  }
}