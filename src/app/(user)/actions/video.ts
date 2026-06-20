// src/app/(user)/actions/video.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// FUNGSI 1: GENERATE MAGIC VIDEO IDEA
// ------------------------------------------------------------------
export async function generateMagicVideoIdeaFromGemini(
  engine: string, 
  style: string, 
  shape: string, 
  recentIdeas: string[] = []
) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi di server.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });

    const randomDuration = Math.floor(Math.random() * (20 - 8 + 1)) + 8; 

    const avoidInstruction = recentIdeas.length > 0
       ? `\nCRITICAL RULE: DO NOT generate any concept, subject, or prompt that is similar to these previously generated ideas:\n- ${recentIdeas.join('\n- ')}\n\nYou MUST provide a completely fresh and vastly different concept to prevent Adobe Stock rejection for similarity.`
       : "";

    const systemInstruction = `You are a creative director for a top-selling Adobe Stock video contributor. Your goal is to generate ONE highly unique, commercially viable, and visually stunning base idea prompt for a generative art video background.
    
    The animation MUST STRICTLY follow the user's manually selected combination:
    - Coding Engine: ${engine}
    - Visual Style: ${style}
    - Main Shape/Element: ${shape}
    
    Target Hardware Optimization: The rendering will be done on an NVIDIA RTX 3060. Therefore, the concept MUST be highly detailed, utilizing complex particle systems, dense geometries, advanced shaders, or rich volumetric concepts that look expensive and premium.

    ${avoidInstruction}
    
    Rule:
    1. Keep the 'prompt' concise, max 40 words.
    2. Emphasize extremely high commercial value (e.g., modern corporate background, high-end sci-fi HUD, luxury vj visuals, futuristic AI data streams) that fits the selected style and shape.
    3. Respond ONLY with the final prompt text. Do not use quotes, do not use JSON format, do not add any other formatting.`;

    const response = await ai.models.generateContent({
         model: "gemini-3-flash-preview", // Menggunakan Gemini 3 Flash Preview
         contents: [{ role: "user", parts: [{ text: systemInstruction }] }]
    });

    const generatedPrompt = response.text ? response.text.replace(/["']/g, "").trim() : `Seamless looping ${style} animation with ${shape}`;
    
    return { 
      success: true, 
      idea: {
        duration: randomDuration,
        prompt: generatedPrompt
      }
    };

  } catch (err: unknown) {
    console.error("Failed to generate magic video idea", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal memuat ide dari Gemini" };
  }
}

// ------------------------------------------------------------------
// FUNGSI 2: GENERATOR KODE VIDEO & SEO (MATH & AESTHETIC GUARDRAILS)
// ------------------------------------------------------------------
export async function generateVideoCodeWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const prompt = formData.get("prompt") as string;
    
    const engine = formData.get("engine") as string || "threejs";
    const style = formData.get("style") as string || "abstract";
    const shape = formData.get("shape") as string || "geometric";
    const duration = formData.get("duration") as string || "10";
    
    if (!userId || !prompt) throw new Error("Data tidak lengkap.");

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    let engineInstructions = "";
    if (engine === "pixijs") {
        engineInstructions = `
          Library: PixiJS (v7). 
          Initialization: 
          const app = new PIXI.Application({ width: window.innerWidth, height: window.innerHeight, backgroundColor: 0x000000, resolution: window.RENDER_SCALE || 1, autoDensity: true, preserveDrawingBuffer: true, backgroundAlpha: 1, clearBeforeRender: true });
          document.body.appendChild(app.view);
          Use PIXI.Ticker to animate.
          CRITICAL FOR PIXI SHADERS: Always use 'varying vec2 vTextureCoord;' and 'vec2 uv = vTextureCoord;' to map coordinates perfectly without breaking resolution scaling.
        `;
    } else if (engine === "threejs") {
        engineInstructions = `
          Library: Three.js (r128). 
          Initialization: Setup Scene, PerspectiveCamera, WebGLRenderer.
          CRITICAL COLOR FIX: 
          const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: false, premultipliedAlpha: false });
          renderer.setPixelRatio(window.RENDER_SCALE || 1);
          renderer.setClearColor(0x000000, 1);
          renderer.outputEncoding = THREE.sRGBEncoding;
          document.body.appendChild(renderer.domElement);
          Use requestAnimationFrame to animate.
        `;
    } else if (engine === "p5js") {
        engineInstructions = `
          Library: p5.js.
          Call createCanvas(windowWidth, windowHeight) inside setup().
          CRITICAL: Call pixelDensity(window.RENDER_SCALE || 1) inside setup().
          CRITICAL: Call background(0) inside both setup() and draw() to prevent ghosting. Avoid clear().
        `;
    }

    // UPDATE BESAR: Pagar Logika Matematika dan Pencegahan Hallusinasi AI
    const systemPrompt = `
      You are an elite creative coder (Expert in ${engine} and GLSL) and an SEO expert for Adobe Stock.
      
      ${engineInstructions}
      
      CRITICAL MATH & AESTHETIC GUARDRAILS (PREVENT VISUAL BUGS):
      1. MATCH THE VIBE TO MATH: If the prompt describes "liquid", "smooth", "silky", or "elegant", you MUST use LOW frequency noise/multipliers (e.g., p * 1.0 to p * 5.0). NEVER use high frequencies (e.g., p * 100.0) for smooth surfaces, as it causes ugly pixelated TV static.
      2. PREVENT BLACK SCREENS (GLSL STRICTNESS): In shaders, NEVER mix floats and integers. Always add '.0' to whole numbers (e.g., write 'vec3(100.0)' instead of 'vec3(100)').
      3. SEAMLESS LOOP: The animation MUST PERFECTLY REPEAT EVERY ${duration} SECONDS. Use Math.sin((time / ${duration}) * Math.PI * 2) or equivalent angle math in shaders.
      4. NO CHEAP NOISE: Avoid pure 'Math.random()' pixel noise. Use proper easing, Fractal Brownian Motion (FBM), or Signed Distance Fields (SDF) for premium 4K quality.
      5. TARGET HARDWARE (RTX 3060): Render high-quality specular highlights (Phong/Blinn-Phong), glowing post-processing, and smooth gradients. Ensure it looks expensive and cinematic.
      
      Visual Style: ${style}
      Main Shape/Element: ${shape}
      User Prompt Context: ${prompt}
      
      CRITICAL OUTPUT FORMAT:
      You MUST respond ONLY with a VALID JSON object. Do NOT wrap it in a markdown block (no \`\`\`json). The JSON must have exactly these keys:
      {
        "code": "Raw executable JavaScript/GLSL code here. Escape quotes properly.",
        "title": "Highly commercial, SEO-friendly title for Adobe Stock (max 150 chars)",
        "keywords": "Comma-separated list of exactly 45 highly relevant microstock keywords",
        "category": "Numeric ID of the relevant Adobe Stock category (e.g., '8' or '19')"
      }
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview", // Pastikan versi model benar
        contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    let aiOutput = response.text || "{}";
    
    // Mencegah error parsing jika AI membandel menaruh markdown
    aiOutput = aiOutput
      .replace(new RegExp('```json', 'gi'), "")
      .replace(new RegExp('```javascript', 'gi'), "")
      .replace(new RegExp('```js', 'gi'), "")
      .replace(new RegExp('```', 'g'), "")
      .trim();
    
    const parsedData = JSON.parse(aiOutput);
    
    const generatedCode = parsedData.code || "";
    const generatedTitle = parsedData.title || "";
    const generatedKeywords = parsedData.keywords || "";
    const generatedCategory = parsedData.category || "8";

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'video_engine_generator', tokens_used: 1 });

    return { 
      success: true, 
      code: generatedCode, 
      title: generatedTitle,
      keywords: generatedKeywords,
      category: generatedCategory,
      newTokenBalance 
    };

  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal AI atau parsing JSON gagal. Coba generate ulang." };
  }
}