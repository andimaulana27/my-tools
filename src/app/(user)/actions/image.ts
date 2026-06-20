// src/app/(user)/actions/image.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Menggunakan Service Role Key untuk bypass RLS (karena ini server action)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// KAMUS STYLE KHUSUS MICROSTOCK UNTUK IMAGEN 4.0
const STYLE_PROMPTS: Record<string, string> = {
  "Duotone Offset Line Art": "Clean minimalist line art with a medium black outline, single offset spot color accent, isolated on pure white background, easy to trace.",
  "Flat Layered Scenery": "Flat 2D vector layered scenery, geometric and organic shapes overlapping for depth, monochromatic or analogous color palette, no outlines, pure white background.",
  "Kawaii Thick Outline Sticker": "Cute Kawaii Japanese sticker style, objects with cute simple faces, very thick bold black outlines, vibrant solid colors, decorated with tiny sparkles and stars, isolated on pure white background.",
  "Corporate Memphis Flat": "Corporate Memphis flat design style, exaggerated dynamic proportions, no outlines, striking contrast using two strong complementary colors, minimalist facial features, pure white background.",
  "Grid Spot Color Icons": "Precise line icon set, uniform stroke width, structured and aligned, dark grey or black structure with exactly one bright spot color to highlight details, pure white background.",
  "Flat Pastel Elements": "Flat pastel vector elements, soft and calming pastel color palette, no outlines, clean and simple vector shapes, pure white background.",
  "Monoline Spot Badge": "Monoline badge illustration style, uniform single-thickness line weight, accompanied by offset organic color blobs or watercolor-like spots in the background, pure white background.",
  "Continuous One Line Botanical": "Elegant continuous one-line drawing style, single unbroken black line, accompanied by a solid offset pastel green or earth-tone color block, pure white background.",
  "Abstract Boho Geometric": "Abstract geometric Boho style, aesthetic compositions using arches, sun and moon elements, and layered landscapes, warm earth-tone color palette like terracotta, sage green, and beige, pure white background.",
  
  "3D Isometric Clay": "3D isometric view, soft clay render style, smooth matte lighting, clean pastel colors, pure white background, isolated 3D object.",
  "Flat Vector No Outline": "Detailed flat vector illustration, completely borderless with no outlines, crisp distinct color boundaries, shading using solid color blocks, pure white background.",
  "Detailed Comic Outline": "Detailed comic book illustration style, bold dynamic black outlines, vibrant pop-art colors, halftone dot shading effects, isolated on pure white background.",
  "Solid Black Silhouette": "Solid pure black silhouette graphic, extremely clean and smooth edges, absolutely no details or colors inside the shape, pure white background, ideal for cutting machines.",
  "Watercolor Isolated": "Soft watercolor painting style, translucent fluid color washes, organic edges, isolated perfectly on a pure white background, no messy splatters outside the main subject.",
  "Vintage Retro Engraving": "Vintage retro woodcut engraving style, detailed hatching and cross-hatching linework, single dark ink color on pure white background, antique aesthetic.",
  "Low Poly 3D": "Low poly 3D geometric art style, sharp angular facets, flat shaded polygons, distinct lighting casting clear geometric shadows, isolated on pure white background.",
  
  // -- NEW STYLES: HANDDRAWN & HALFTONE --
  "Handdrawn Minimalist Doodle": "Hand-drawn minimalist doodle style, sketchy irregular lines, organic and authentic feel, imperfect charming pencil-like strokes, pure white background, isolated vector elements.",
  "Retro Halftone Pop-Art": "Retro pop-art style, striking halftone dot patterns used for shading, bold vintage comic book outlines, vibrant high-contrast colors, isolated on pure white background."
};

// ------------------------------------------------------------------
// FUNGSI UTAMA: GENERATOR IMAGE BATCH (DIRECT TO IMAGEN 4.0)
// ------------------------------------------------------------------
export async function generateImageWithToken(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const prompt = formData.get("prompt") as string; 
    const ratio = formData.get("ratio") as string; 
    const imageType = formData.get("imageType") as string || "vector"; 
    const outputMode = formData.get("outputMode") as string || "single";
    const seasonalEvent = formData.get("seasonalEvent") as string || "";
    
    const style = formData.get("style") as string || ""; 
    const theme = formData.get("theme") as string || ""; 

    if (!userId || !prompt || !ratio) throw new Error("Data tidak lengkap untuk generasi gambar.");

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi di server.");

    // Cek saldo token user
    const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("token_balance")
        .eq("id", userId)
        .single();

    if (profileError || !profile || typeof profile.token_balance !== 'number' || profile.token_balance <= 0) {
        throw new Error("INSUFFICIENT_TOKENS");
    }

    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    const targetModel = "imagen-4.0-generate-001"; 

    // Merakit prompt murni dari input user dan pengaturan UI
    const mappedStylePrompt = STYLE_PROMPTS[style] || style;
    const setConstraint = outputMode === "set" ? "Must be a seamless vector set arranged symmetrically in perfectly straight horizontal and vertical rows (grid layout) on a solid pure white background." : "A single isolated subject perfectly centered.";
    const qualityBooster = imageType === "realistic" 
      ? "high quality, photorealistic, 8k resolution, highly detailed, no text, no watermark" 
      : "Professional microstock vector style illustration, clean and sharp edges, flawless layout, highest quality, isolated on pure white background, no text.";

    const finalMasterPrompt = `
      SUBJECT & COMPOSITION: ${prompt.trim()}.
      LAYOUT: ${imageType === "vector" ? setConstraint : "Single photograph"}.
      ${imageType === "vector" && style ? `STYLE CONSTRAINT: ${mappedStylePrompt}` : ""}
      ${imageType === "realistic" && theme ? `THEME/NICHE: ${theme}` : ""}
      ${seasonalEvent ? `SEASONAL CONTEXT: ${seasonalEvent}` : ""}
      QUALITY: ${qualityBooster}
      ASPECT RATIO TARGET: Framed perfectly for ${ratio} screen space.
    `.trim().replace(/\s+/g, ' ');

    // Hit ke Imagen
    const response = await ai.models.generateImages({
        model: targetModel,
        prompt: finalMasterPrompt,
        config: {
            numberOfImages: 1,
            aspectRatio: ratio, 
            outputMimeType: "image/jpeg",
        }
    });

    if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("Google Imagen tidak mengembalikan gambar.");
    }

    const firstImage = response.generatedImages[0];
    if (!firstImage.image || !firstImage.image.imageBytes) {
        throw new Error("Data gambar (imageBytes) tidak ditemukan dalam respons API.");
    }

    const imageBytes = firstImage.image.imageBytes;
    const base64Url = `data:image/jpeg;base64,${imageBytes}`;

    const newTokenBalance = profile.token_balance - 1;

    // Potong saldo & catat usage
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'image_generator_imagen', tokens_used: 1 });

    return { success: true, imageUrl: base64Url, newTokenBalance };

  } catch (err: unknown) { 
    return { success: false, error: err instanceof Error ? err.message : "Terjadi kesalahan internal men-generate gambar via Imagen." };
  }
}