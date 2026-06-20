// src/app/(user)/actions/converter.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { exec } from "child_process";
import util from "util";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import os from "os";

const execPromise = util.promisify(exec);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// 1. FUNGSI KONVERTER GAMBAR (FULL MEMORY / NO DISK STORAGE)
// ------------------------------------------------------------------
export async function processImageConverter(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const configStr = formData.get("config") as string;

    if (!userId || !file || !configStr) throw new Error("Data tidak lengkap.");

    const config = JSON.parse(configStr);
    const targetFormat = config.targetFormat.replace(".", "").toLowerCase();

    const { data: profile } = await supabaseAdmin.from("profiles").select("token_balance").eq("id", userId).single();
    if (!profile || profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    let sharpInstance = sharp(buffer);
    let mimeType = `image/${targetFormat}`;

    if (targetFormat === "jpg" || targetFormat === "jpeg") {
      sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } }).jpeg({ quality: 95 });
      mimeType = "image/jpeg";
    } else if (targetFormat === "png") {
      sharpInstance = sharpInstance.png({ quality: 100 });
    } else if (targetFormat === "webp") {
      sharpInstance = sharpInstance.webp({ quality: 95, lossless: true });
    } else if (targetFormat === "avif") {
      sharpInstance = sharpInstance.avif({ quality: 90 });
    } else if (targetFormat === "tiff") {
      sharpInstance = sharpInstance.tiff();
    } else if (targetFormat === "gif") {
      sharpInstance = sharpInstance.gif();
    } else if (targetFormat === "ico") {
      sharpInstance = sharpInstance.resize(256, 256).png();
      mimeType = "image/x-icon";
    }

    const outputBuffer = await sharpInstance.toBuffer();
    const base64Data = outputBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'image_converter', tokens_used: 1 });

    return { success: true, url: dataUrl, format: targetFormat, newTokenBalance };
  } catch (err: unknown) {
    console.error("Konverter API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal mengkonversi gambar." };
  }
}

// ------------------------------------------------------------------
// 2. FUNGSI GPU UPSCALER (OPTIMASI NVIDIA RTX 3060 12GB)
// ------------------------------------------------------------------
export async function processGPUUpscale(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const file = formData.get("file") as File;
    const configStr = formData.get("config") as string;

    if (!userId || !file || !configStr) throw new Error("Data tidak lengkap.");

    const config = JSON.parse(configStr);
    const scale = config.upscaleScale;
    const modelName = config.upscaleModel;

    const { data: profile } = await supabaseAdmin.from("profiles").select("token_balance").eq("id", userId).single();
    if (!profile || profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const originalExt = path.extname(file.name) || ".png";
    const tempDir = os.tmpdir();
    
    const inputPath = path.join(tempDir, `temp_in_${Date.now()}${originalExt}`);
    await fs.writeFile(inputPath, buffer);

    let engineFormat = originalExt.replace(".", "").toLowerCase();
    if (engineFormat === "jpeg") engineFormat = "jpg";

    const outputPath = path.join(tempDir, `temp_out_${Date.now()}.${engineFormat}`);
    
    const isWindows = os.platform() === "win32";
    const exeName = isWindows ? "realesrgan-ncnn-vulkan.exe" : "realesrgan-ncnn-vulkan";
    const exePath = path.join(process.cwd(), "backend", exeName);
    
    if (!existsSync(exePath)) {
      await fs.unlink(inputPath).catch(()=>null);
      throw new Error(`Engine GPU tidak ditemukan! Pastikan file '${exeName}' ada di dalam folder 'backend'. Path yg dicari: ${exePath}`);
    }

    // OPTIMASI NVIDIA RTX 3060 12GB:
    // -g 0: Memaksa engine menggunakan GPU utama (NVIDIA RTX) dan mengabaikan iGPU (AMD/Intel).
    // -t 800: Menggunakan ukuran tile besar karena VRAM 12GB sangat lapang (mencegah bottleneck).
    // -j 4:4:4: Mengalokasikan 4 thread untuk komputasi paralel maksimal.
    const command = `"${exePath}" -i "${inputPath}" -o "${outputPath}" -n ${modelName} -s ${scale} -f ${engineFormat} -g 0 -t 800 -j 4:4:4`;

    try {
      await execPromise(command);
    } catch (execError: unknown) {
      await fs.unlink(inputPath).catch(()=>null);
      let errOut = "Unknown Execution Error";
      if (execError instanceof Error) errOut = execError.message;
      throw new Error(`Error GPU Engine: ${errOut}`);
    }

    const outBuffer = await fs.readFile(outputPath);
    const base64Data = outBuffer.toString("base64");
    const mimeType = engineFormat === "jpg" ? "image/jpeg" : `image/${engineFormat}`;
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    await fs.unlink(inputPath).catch(()=>null);
    await fs.unlink(outputPath).catch(()=>null);

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'gpu_upscaler', tokens_used: 1 });

    return { success: true, url: dataUrl, format: engineFormat, newTokenBalance };
  } catch (err: unknown) {
    console.error("Upscaler API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal memproses gambar melalui GPU." };
  }
}

// ------------------------------------------------------------------
// 3. FUNGSI: AI BACKGROUND REMOVER (HANYA POTONG TOKEN - PROSES DI CLIENT)
// ------------------------------------------------------------------
export async function processRemoveBackground(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    if (!userId) throw new Error("Data user tidak lengkap.");

    const { data: profile } = await supabaseAdmin.from("profiles").select("token_balance").eq("id", userId).single();
    if (!profile || profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'bg_remover', tokens_used: 1 });

    return { success: true, newTokenBalance };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memotong token." };
  }
}

// ------------------------------------------------------------------
// 4. FUNGSI: SMART COMPRESSOR (HANYA POTONG TOKEN - PROSES DI CLIENT)
// ------------------------------------------------------------------
export async function processCompressImage(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    if (!userId) throw new Error("Data user tidak lengkap.");

    const { data: profile } = await supabaseAdmin.from("profiles").select("token_balance").eq("id", userId).single();
    if (!profile || profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'image_compressor', tokens_used: 1 });

    return { success: true, newTokenBalance };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : "Gagal memotong token untuk Kompresor." };
  }
}