// src/app/(user)/actions/voice.ts
"use server";

import { createClient } from "@supabase/supabase-js";
import os from "os";
import path from "path";
import fs from "fs/promises";
import { EdgeTTS } from "node-edge-tts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ------------------------------------------------------------------
// FUNGSI TEXT-TO-SPEECH (EDGE NEURAL AI)
// ------------------------------------------------------------------
export async function generateTTS(formData: FormData) {
  try {
    const userId = formData.get("userId") as string;
    const text = formData.get("text") as string;
    const voice = formData.get("voice") as string;
    // Parameter speed dan pitch diterima dari frontend meskipun library node-edge-tts saat ini 
    // mungkin belum mendukung modifikasi pitch/speed secara native di versi basic,
    // tapi kita siapkan parameternya sesuai UI yang Anda buat.
    const speed = formData.get("speed") as string;
    const pitch = formData.get("pitch") as string;

    if (!userId || !text || !voice) throw new Error("Data tidak lengkap.");

    const { data: profile } = await supabaseAdmin.from("profiles").select("token_balance").eq("id", userId).single();
    if (!profile || profile.token_balance <= 0) throw new Error("INSUFFICIENT_TOKENS");

    const tempDir = os.tmpdir();
    const outputPath = path.join(tempDir, `tts_${Date.now()}.mp3`);

    let rate = "+0%";
    let pitchStr = "+0Hz";
    
    if (speed && parseInt(speed) !== 0) {
        rate = parseInt(speed) > 0 ? `+${speed}%` : `${speed}%`;
    }
    if (pitch && parseInt(pitch) !== 0) {
        pitchStr = parseInt(pitch) > 0 ? `+${pitch}Hz` : `${pitch}Hz`;
    }

    const tts = new EdgeTTS({
      voice: voice,
      lang: voice.split('-').slice(0, 2).join('-'), 
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      rate: rate,
      pitch: pitchStr
    });

    await tts.ttsPromise(text, outputPath);
    const outBuffer = await fs.readFile(outputPath);
    const base64Data = outBuffer.toString("base64");
    const dataUrl = `data:audio/mp3;base64,${base64Data}`;

    await fs.unlink(outputPath).catch(() => null);

    const newTokenBalance = profile.token_balance - 1;
    await supabaseAdmin.from("profiles").update({ token_balance: newTokenBalance }).eq("id", userId);
    await supabaseAdmin.from("tools_usage").insert({ user_id: userId, tool_name: 'voice_generator', tokens_used: 1 });

    return { success: true, audioDataUrl: dataUrl, newTokenBalance };

  } catch (err: unknown) {
    console.error("TTS API Error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Gagal menghasilkan suara." };
  }
}