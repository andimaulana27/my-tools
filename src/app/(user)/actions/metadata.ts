// src/app/(user)/actions/metadata.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function processMetadataWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const mode = formData.get("mode") as string; 
    const imageType = formData.get("imageType") as string || "vector"; // Tipe: vector atau realistic
    const configStr = formData.get("config") as string;
    
    if (!userId || !file || !configStr) throw new Error("Data tidak lengkap.");

    const config = JSON.parse(configStr);

    // Verifikasi Token Pengguna
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    // Menggunakan API Key Pribadi Anda
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    let promptText = "";

    // MENGATUR DESKRIPSI ASET BERDASARKAN TIPE GAMBAR DENGAN RUMUS SEO SUPER POWERFUL
    const assetTypeDescription = imageType === "vector" 
      ? `a premium commercial vector graphic / illustration asset. 
         TITLE FORMULA: [Primary Search Keyword/Subject] + [Action/Context] + [Dominant Color/Visual Trait] + [Style: e.g., Flat, Line Art, Isometric] + [Asset Format: e.g., Vector Background, Icon Set, Seamless Pattern, Template] + [Commercial Concept].
         CRITICAL TITLE SEO RULES:
         1. FRONT-LOADING: The most critical and high-volume keywords MUST be the first 3-5 words of the title.
         2. NO FILLER WORDS: Strictly avoid words like "a", "an", "the", "picture of", "illustration of". Make it a dense string of searchable keywords.
         3. COMMERCIAL INTENT: Always include what the asset can be used for (e.g., landing page, infographic, banner, presentation).
         Make the title highly descriptive, SEO-optimized, and click-driven for buyers.
         
         KEYWORD FORMULA: Prioritize high-search-volume commercial keywords. Sort strictly by importance (most important first). Include: 1. Literal subjects, 2. Synonyms, 3. Actions/Concepts (e.g., success, technology, abstract), 4. Styles (vector, flat, gradient, graphic, design, art), 5. Colors/Themes. 
         Do NOT use photography terms like 'photo', 'bokeh', 'camera', or 'lens'.`
      : `a premium realistic commercial photograph / photorealistic image. 
         TITLE FORMULA: [Main Subject] + [Action/Emotion] + [Setting/Location/Environment] + [Lighting/Time of Day] + [Composition: e.g., Close-up, Portrait, Wide Angle] + [Conceptual Meaning]. Make the title cinematic, highly descriptive, and buyer-focused for maximum SEO discovery.
         CRITICAL TITLE SEO RULES:
         1. FRONT-LOADING: The most important subjects must be at the very beginning.
         2. NO FILLER WORDS: Avoid "a photo of", "image of".
         KEYWORD FORMULA: Prioritize high-search-volume photography keywords. Include: 1. Core subjects, 2. Synonyms, 3. Concepts/Emotions, 4. Composition/Lighting (e.g., natural light, macro, realistic, authentic), 5. Demographics (if people are present).
         Do NOT use illustration terms like 'vector', 'flat design', 'drawing', or 'clip art'.`;

    // Fitur Naming bawaan web pribadi
    if (mode === "naming") {
      promptText = `
        Analyze this image which is ${assetTypeDescription}. 
        Generate highly relevant, clean, and professional recommendations for naming the raw project folder and the master design file for a microstock workflow.
        
        Requirements:
        - Identify the main subject.
        - Identify if it is a "set", "bundle", "collection", "pack", or a single element. Strongly emphasize this in the names.
        - "folderName": Must be in lowercase with hyphens (kebab-case).
        - "fileName": Must be in lowercase with underscores (snake_case).
        - "title": A human-readable display title for this asset.
        
        Respond STRICTLY in JSON format with exactly these keys: "title", "folderName", and "fileName".
      `;
    } else {
      // Instruksi Utama Adobe / Canva dengan Optimasi SEO Maksimal
      promptText = `
        Analyze this image which is ${assetTypeDescription} and generate HIGHLY OPTIMIZED metadata for a microstock marketplace (${mode}) to maximize search visibility, buyer discovery, and downloads.
        
        Requirements:
        - Title Length: ${config.titleLengthMin} to ${config.titleLengthMax} characters. Ensure the title flows naturally but is packed with powerful, high-volume search terms.
        - Keywords Count: EXACTLY ${config.keywordsCount} comma-separated keywords.
        - Concept Context: ${config.conceptContext || 'None'}. If provided, you MUST treat this context as highly important, especially if it describes the parent "set" or core subject of an abstract element.
        - Negative Keywords to avoid: ${config.negativeKeywords}, white background, isolated on white, transparent background, background.
        
        CRITICAL SEO INSTRUCTIONS:
        - Sort keywords by RELEVANCE and SEARCH VOLUME (put the most important, broad, and high-converting keywords first, followed by specific niche keywords).
        - Use a mix of literal keywords (what the image physically is) and conceptual keywords (what the image represents or solves, e.g., "freedom", "innovation", "teamwork").
        - Include trending and commercial variations (e.g., if it's a business vector, include "startup", "corporate", "infographic").

        CRITICAL INSTRUCTION FOR ISOLATED ELEMENTS:
        If this image is a single element (like a splash, icon, or character), assume it has a transparent background. YOU MUST STRICTLY FORBID the use of any background-related terms (e.g., "white background", "isolated on white", "on white") in both the title and keywords.
        
        If the mode is "adobe", you MUST strictly analyze the image and assign the most accurate category numeric code based on this exact Adobe Stock mapping:
        1: Animals, 2: Buildings and Architecture, 3: Business, 4: Drinks, 5: The Environment, 6: States of Mind, 7: Food, 8: Graphic Resources, 9: Hobbies and Leisure, 10: Industry, 11: Landscapes, 12: Lifestyle, 13: People, 14: Plants and Flowers, 15: Culture and Religion, 16: Science, 17: Social Issues, 18: Sports, 19: Technology, 20: Transport, 21: Travel.
        
        Respond STRICTLY in JSON format with exactly these keys: "title", "keywords", "description", and "category" (as an integer).
      `;
    }

    // UPDATE MODEL: Memprioritaskan Gemini 3.1 Pro Preview untuk kualitas maksimal, lalu fallback ke seri Flash
    const modelsToTry = [
      "gemini-3-flash-preview", 
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",  
      "gemini-2.0-flash", 
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
              parts: [{ text: promptText }, { inlineData: { mimeType: file.type, data: base64Data } }]
          }],
          config: { responseMimeType: "application/json" }
        });
        aiResponseText = response.text || "{}";
        isSuccess = true;
        break; 
      } catch (err: unknown) { 
        lastErrorMessage = err instanceof Error ? err.message : String(err);
        console.warn(`Model Metadata ${modelName} gagal:`, lastErrorMessage);
      }
    }

    if (!isSuccess) throw new Error(`Semua server model AI sedang sibuk. Terakhir: ${lastErrorMessage}`);

    let cleanJson = aiResponseText;
    const startIndex = cleanJson.indexOf('{');
    const endIndex = cleanJson.lastIndexOf('}');

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      cleanJson = cleanJson.substring(startIndex, endIndex + 1);
    } else {
      cleanJson = cleanJson.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const metadataResult = JSON.parse(cleanJson);
    if (mode === "adobe" && metadataResult.category) {
        metadataResult.category = parseInt(metadataResult.category, 10) || 8;
    }
    
    // Potong Token & Catat Log
    const newTokenBalance = profile.token_balance - 1;
    const toolNameLog = mode === 'adobe' ? 'adobe_stock_generator' : mode === 'canva' ? 'canva_generator' : 'file_naming_generator';

    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: toolNameLog, tokens_used: 1 });

    return { success: true, metadata: metadataResult, newTokenBalance };
    
  } catch (err: unknown) { 
    console.error("Metadata API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal AI." };
  }
}