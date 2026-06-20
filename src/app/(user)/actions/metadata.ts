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
    const imageType = formData.get("imageType") as string || "vector";
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

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const arrayBuffer = await file.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    let promptText = "";

    // LOGIKA PROMPT BERDASARKAN MODE (Shutterstock, Adobe, Canva, Naming)
    if (mode === "naming") {
      const namingDescription = imageType === "vector" ? "premium commercial vector graphic" : "premium realistic photograph";
      promptText = `
        Analyze this image which is a ${namingDescription}. 
        Generate highly relevant, clean, and professional recommendations for naming the raw project folder and the master design file for a microstock workflow.
        
        Requirements:
        - Identify the main subject.
        - "folderName": Must be in lowercase with hyphens (kebab-case).
        - "fileName": Must be in lowercase with underscores (snake_case).
        - "title": A human-readable display title for this asset.
        
        Respond STRICTLY in JSON format with exactly these keys: "title", "folderName", and "fileName".
      `;
    } else if (mode === "shutterstock") {
      promptText = `
        Analyze this image (type: ${imageType}) and generate metadata STRICTLY adhering to Shutterstock's Best Practices.
        
        SHUTTERSTOCK CRITICAL RULES FOR TITLE (DESCRIPTION):
        1. Read like a natural sentence or phrase, NOT a list of keywords. Think of it as a news headline.
        2. Answer the main questions: Who, What, When, Where, and Why, capturing the mood/emotion.
        3. Do NOT merely list keywords (e.g., "Dog. Flower. Pattern." is REJECTED).
        4. Avoid repeating words or phrases.
        5. Must have perfect English spelling and grammar without special characters.
        6. Example of Good Title: "Seamless pattern of a Shiba Inu dog with blue, red and pink floral background elements."
        
        SHUTTERSTOCK CRITICAL RULES FOR KEYWORDS:
        1. Provide EXACTLY ${config.keywordsCount} comma-separated keywords (Max 50).
        2. Do NOT repeat the same base words or compound words excessively (no keyword spamming). Use a diverse, precise vocabulary.
        3. Include broader topics, feelings, concepts, or associations.
        4. Do NOT enter unrelated terms.
        5. ${imageType === "vector" ? "Strictly no photography terms (photo, camera, bokeh)." : "Strictly no illustration terms (vector, flat design, drawing)."}
        6. Negative keywords to avoid: ${config.negativeKeywords}.
        
        Category: You MUST assign EXACTLY ONE category from this official list ONLY: 
        "Abstract", "Animals/Wildlife", "Arts", "Backgrounds/Textures", "Beauty/Fashion", "Buildings/Landmarks", "Business/Finance", "Celebrities", "Education", "Food and drink", "Healthcare/Medical", "Holidays", "Industrial", "Interiors", "Miscellaneous", "Nature", "Objects", "Parks/Outdoor", "People", "Religion", "Science", "Signs/Symbols", "Sports/Recreation", "Technology", "Transportation", "Vintage".
        
        Respond STRICTLY in JSON format with exactly these keys: "title", "keywords", and "category" (as string).
      `;
    } else if (mode === "adobe") {
      promptText = `
        Analyze this image (type: ${imageType}) and generate highly optimized metadata STRICTLY adhering to Adobe Stock Official Best Practices.

        ADOBE STOCK TITLE RULES:
        1. Use concise, natural-sounding language that provides details (Who, What, Where, When, Why).
        2. DO NOT use keyword spamming or list words separated by commas. It must read like a descriptive sentence.
        3. Length: Ideally around 70 characters, max ${config.titleLengthMax}.
        4. Describe the core subject matter accurately and literally.

        ADOBE STOCK KEYWORD RULES:
        1. Quantity: EXACTLY ${config.keywordsCount} comma-separated keywords.
        2. CRITICAL ORDER: Arrange keywords strictly in order of relevance. The FIRST 10 KEYWORDS are the most important for Adobe search algorithms.
        3. TOP 10 MANDATE: All important words used in the Title MUST be included within the first 10 keywords.
        4. Storytelling & Demographics: If people are in the image, include their age (e.g., 20s, 30s, Adult), gender, ethnicity, role, and relationship. 
        5. If there are NO PEOPLE in the image, you MUST include the keywords "no people" or "nobody".
        6. Include specific concepts, feelings, and moods.
        7. Avoid synonym spam (e.g., don't add dog, dogs, canine, canines - just pick the most accurate).
        8. Negative keywords to avoid: ${config.negativeKeywords}.

        Category: You MUST strictly analyze the image and assign the most accurate category numeric code based on this exact Adobe Stock mapping:
        1: Animals, 2: Buildings and Architecture, 3: Business, 4: Drinks, 5: The Environment, 6: States of Mind, 7: Food, 8: Graphic Resources, 9: Hobbies and Leisure, 10: Industry, 11: Landscapes, 12: Lifestyle, 13: People, 14: Plants and Flowers, 15: Culture and Religion, 16: Science, 17: Social Issues, 18: Sports, 19: Technology, 20: Transport, 21: Travel.
        
        Respond STRICTLY in JSON format with exactly these keys: "title", "keywords", "description" (optional), and "category" (as an integer).
      `;
    } else {
       promptText = `
        Analyze this image which is a commercial ${imageType} asset and generate HIGHLY OPTIMIZED metadata for a microstock marketplace (${mode}).
        
        Requirements:
        - "title": Length ${config.titleLengthMin} to ${config.titleLengthMax} characters. Ensure the title is descriptive and packed with powerful search terms.
        - "keywords": EXACTLY ${config.keywordsCount} comma-separated keywords.
        - Concept Context: ${config.conceptContext || 'None'}. 
        - Negative Keywords to avoid: ${config.negativeKeywords}, white background, isolated on white, transparent background, background.
        
        Respond STRICTLY in JSON format with exactly these keys: "title", "keywords".
      `;
    }

    const modelsToTry = [
      "gemini-3-flash-preview", 
      "gemini-2.5-flash",
      "gemini-2.5-flash-lite",  
      "gemini-2.0-flash", 
      "gemini-2.0-flash-001"
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
      // Penanganan aman untuk mencegah Parsing error: Unterminated regular expression literal
      const jsonRegex = new RegExp('```json', 'gi');
      const tickRegex = new RegExp('```', 'g');
      cleanJson = cleanJson.replace(jsonRegex, "").replace(tickRegex, "").trim();
    }

    const metadataResult = JSON.parse(cleanJson);
    if (mode === "adobe" && metadataResult.category) {
        metadataResult.category = parseInt(metadataResult.category, 10) || 8;
    }
    
    const newTokenBalance = profile.token_balance - 1;
    
    let toolNameLog = 'file_naming_generator';
    if (mode === 'adobe') toolNameLog = 'adobe_stock_generator';
    else if (mode === 'canva') toolNameLog = 'canva_generator';
    else if (mode === 'shutterstock') toolNameLog = 'shutterstock_generator';

    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: toolNameLog, tokens_used: 1 });

    return { success: true, metadata: metadataResult, newTokenBalance };
    
  } catch (err: unknown) { 
    console.error("Metadata API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal AI." };
  }
}