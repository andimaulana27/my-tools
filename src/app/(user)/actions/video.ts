"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";
import {
  catalogForPrompt,
  clampDuration,
  fingerprintLabel,
  isValidEngine,
  preferredTemplate,
  uniquenessKey,
} from "@/lib/video-engine/catalog";
import { pickStockPrompt, promptBankForGemini } from "@/lib/video-engine/prompt-bank";
import {
  appendUsedPrompt,
  countUsedPrompts,
  isDuplicatePrompt,
  listUsedPromptTexts,
  listUsedUniquenessKeys,
  mergeAvoidLists,
} from "@/lib/video-engine/prompt-history";
import { ensureUniqueSpec, normalizeSpec } from "@/lib/video-engine/uniqueness";
import type { VideoEngineId, VideoSpec } from "@/lib/video-engine/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseJsonObject(raw: string): Record<string, unknown> {
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
  return JSON.parse(cleaned) as Record<string, unknown>;
}

function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000) || 1;
}

export async function generateMagicVideoIdeaFromGemini(
  engine: string,
  style: string,
  shape: string,
  recentIdeas: string[] = [],
  userId?: string | null
) {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi di server.");

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const randomDuration = clampDuration(Math.floor(Math.random() * (16 - 8 + 1)) + 8);

    const storedPrompts = await listUsedPromptTexts(userId);
    const avoidPrompts = mergeAvoidLists(storedPrompts, recentIdeas);

    const bankHit = pickStockPrompt(engine, style, shape, avoidPrompts);
    const bankExamples = promptBankForGemini(engine, style, shape);
    const avoidInstruction = avoidPrompts.length > 0
      ? `\nCRITICAL RULE: DO NOT generate any concept similar to these previously USED prompts:\n- ${avoidPrompts.join("\n- ")}\nThe new idea MUST be a different commercial use-case, material world, and composition.`
      : "";

    const systemInstruction = `You are a creative director for top-selling Adobe Stock motion backgrounds.
Create ONE unique, commercially useful seamless-loop concept.

Locked user choices:
- Engine: ${engine}
- Style: ${style}
- Shape/element: ${shape}

Seed commercial concept to vary (keep the same buyer category, change lighting/material emphasis so it is not a duplicate):
${bankHit ? `${bankHit.buyer}: ${bankHit.prompt}` : "Invent a premium concept that a real buyer would license."}

Other proven sellers in this neighborhood:
${bankExamples || "- luxury studio materials, corporate HUD, wellness water, fashion fabric"}

The renderer already has PBR materials, HDR-like studio lighting, procedural textures, bloom, and seeded uniqueness.
Your job is the CONCEPT, not shader math. Never write neon particle spam.

${avoidInstruction}

Rules:
1. Prompt max 40 words.
2. Mention material/texture feel (marble, ice, brushed metal, velvet, carbon, iridescent, etc.) when it fits.
3. Name a buyer use (jewelry hero, spa, automotive, architecture title bed, skincare, etc.).
4. Respond ONLY with the prompt text. No quotes, no JSON.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
    });

    let generatedPrompt = response.text
      ? response.text.replace(/["']/g, "").trim()
      : bankHit?.prompt || `Seamless looping ${style} ${shape} with premium studio materials`;

    if (isDuplicatePrompt(generatedPrompt, avoidPrompts)) {
      const alt = pickStockPrompt(engine, style, shape, [...avoidPrompts, generatedPrompt]);
      generatedPrompt = alt?.prompt || `${generatedPrompt} unique ${style} ${shape} variation`;
    }

    return {
      success: true,
      idea: {
        duration: randomDuration,
        prompt: generatedPrompt,
      },
    };
  } catch (err: unknown) {
    console.error("Failed to generate magic video idea", err);
    const storedPrompts = await listUsedPromptTexts(userId).catch(() => [] as string[]);
    const fallback = pickStockPrompt(engine, style, shape, mergeAvoidLists(storedPrompts, recentIdeas));
    if (fallback) {
      return {
        success: true,
        idea: {
          duration: clampDuration(Math.floor(Math.random() * (16 - 8 + 1)) + 8),
          prompt: fallback.prompt,
        },
      };
    }
    return { success: false, error: err instanceof Error ? err.message : "Gagal memuat ide dari Gemini" };
  }
}

export async function generateVideoCodeWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const prompt = formData.get("prompt") as string;
    const engineRaw = (formData.get("engine") as string) || "threejs";
    const style = (formData.get("style") as string) || "abstract";
    const shape = (formData.get("shape") as string) || "geometric";
    const duration = clampDuration(Number(formData.get("duration") || 10));
    const usedKeysRaw = (formData.get("usedKeys") as string) || "[]";

    if (!userId || !prompt) throw new Error("Data tidak lengkap.");
    if (!isValidEngine(engineRaw)) throw new Error("Engine tidak valid.");
    const engine: VideoEngineId = engineRaw;

    let usedKeys: string[] = [];
    try {
      const parsed = JSON.parse(usedKeysRaw);
      if (Array.isArray(parsed)) usedKeys = parsed.map(String).slice(-160);
    } catch {
      usedKeys = [];
    }

    const storedKeys = await listUsedUniquenessKeys(userId);
    const storedPrompts = await listUsedPromptTexts(userId);
    usedKeys = Array.from(new Set([...storedKeys, ...usedKeys]));
    const promptAlreadyUsed = isDuplicatePrompt(prompt, storedPrompts);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) throw new Error("Gagal memverifikasi profil pengguna.");
    if (profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const fallback: VideoSpec = {
      engine,
      style,
      shape,
      template: preferredTemplate(engine, shape),
      material: style === "luxury" ? "gold-luxury" : style === "neon" ? "neon-emissive" : "iridescent",
      palette: "obsidian-gold",
      camera: "orbit-hero",
      seed: randomSeed(),
      duration,
      prompt,
    };

    const avoidKeys = usedKeys.length
      ? `NEVER reuse these uniqueness keys (engine|template|material|palette):\n${usedKeys.slice(-120).join("\n")}`
      : "No previous keys.";
    const avoidPrompts = storedPrompts.length
      ? `NEVER reuse or lightly rephrase these already produced prompts:\n- ${mergeAvoidLists(storedPrompts, []).join("\n- ")}`
      : "";

    const systemPrompt = `You are an Adobe Stock motion-graphics director and SEO specialist.
The video is rendered by a locked premium runtime (Three.js r170 PBR / PixiJS textures / p5.js looping noise).
You do NOT write JavaScript or GLSL. You ONLY pick a unique spec and write metadata.

User lock:
- Engine: ${engine}
- Style: ${style}
- Shape: ${shape}
- Duration: ${duration} seconds
- Concept: ${prompt}

Catalog:
${catalogForPrompt(engine)}

Preferred template for this shape: ${fallback.template}

${avoidKeys}

${avoidPrompts}

Adobe Stock rules you must obey:
- Distinct concept, not a color tweak of a previous clip.
- No artist names, brands, celebrities, or IP.
- Title commercial and specific (what the buyer uses it for).
- Exactly 45 comma-separated keywords.
- Category numeric ID (Graphic Resources=8, Technology=19, Business=3, etc.)

Respond ONLY with valid JSON (no markdown):
{
  "template": "one catalog template id",
  "material": "one catalog material id",
  "palette": "one catalog palette id",
  "camera": "one catalog camera id",
  "seed": 12345678,
  "title": "SEO title max 150 chars",
  "keywords": "45 comma-separated keywords",
  "category": "8"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: systemPrompt }] }],
    });

    const parsed = parseJsonObject(response.text || "{}");
    const normalized = normalizeSpec(
      {
        engine,
        style,
        shape,
        template: String(parsed.template || ""),
        material: String(parsed.material || ""),
        palette: String(parsed.palette || ""),
        camera: String(parsed.camera || ""),
        seed: Number(parsed.seed),
        duration,
        prompt,
      },
      fallback
    );

    const unique = ensureUniqueSpec(normalized, usedKeys);

    const generatedTitle = String(parsed.title || "").trim().slice(0, 200);
    const generatedKeywords = String(parsed.keywords || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 49)
      .join(",");
    const generatedCategory = String(parsed.category || "8").replace(/\D/g, "") || "8";

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({
      user_id: userId,
      tool_name: "video_engine_generator",
      tokens_used: 1,
    });

    const uniqueKey = uniquenessKey(unique.spec);
    let historyCount = 0;
    try {
      historyCount = await appendUsedPrompt({
        userId,
        prompt,
        engine,
        style,
        shape,
        template: unique.spec.template,
        material: unique.spec.material,
        palette: unique.spec.palette,
        camera: unique.spec.camera,
        uniquenessKey: uniqueKey,
        title: generatedTitle,
      });
    } catch (historyErr) {
      console.error("Failed to append prompt history", historyErr);
    }

    const duplicateNote = promptAlreadyUsed
      ? "Prompt ini sudah ada di riwayat. Spec divariasikan supaya tidak duplikat visual."
      : "";
    const combinedNote = [unique.note, duplicateNote].filter(Boolean).join(" ");

    return {
      success: true,
      spec: unique.spec,
      title: generatedTitle,
      keywords: generatedKeywords,
      category: generatedCategory,
      fingerprint: fingerprintLabel(unique.spec),
      uniquenessKey: uniqueKey,
      adjusted: unique.adjusted || promptAlreadyUsed,
      note: combinedNote,
      historyCount,
      newTokenBalance,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Terjadi kesalahan internal AI atau parsing JSON gagal. Coba generate ulang.",
    };
  }
}

export async function getVideoPromptHistoryCount(userId?: string | null) {
  try {
    const count = await countUsedPrompts(userId);
    return { success: true, count };
  } catch {
    return { success: true, count: 0 };
  }
}

export async function recordVideoSpecUse(input: {
  userId: string;
  prompt: string;
  engine: string;
  style: string;
  shape: string;
  template: string;
  material: string;
  palette: string;
  camera: string;
  uniquenessKey: string;
  title: string;
}) {
  try {
    const historyCount = await appendUsedPrompt(input);
    return { success: true, historyCount };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal menyimpan riwayat prompt." };
  }
}
