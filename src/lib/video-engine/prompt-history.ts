import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type UsedPromptItem = {
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
};

const MAX_GEMINI_PROMPTS = 80;
const TABLE = "video_prompt_history";

function admin(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase belum dikonfigurasi di server.");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function normalizePromptText(prompt: string): string {
  return prompt.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function isDuplicatePrompt(prompt: string, usedPrompts: string[]): boolean {
  const norm = normalizePromptText(prompt);
  if (!norm) return false;
  return usedPrompts.some((item) => normalizePromptText(item) === norm);
}

export function mergeAvoidLists(fromStore: string[], fromClient: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const item of [...fromStore, ...fromClient]) {
    const key = normalizePromptText(item) || item;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged.slice(-MAX_GEMINI_PROMPTS);
}

export async function listUsedPromptTexts(userId?: string | null): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await admin()
    .from(TABLE)
    .select("prompt")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(400);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.prompt || "")).filter(Boolean);
}

export async function listUsedUniquenessKeys(userId?: string | null): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await admin()
    .from(TABLE)
    .select("uniqueness_key")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(400);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.uniqueness_key || "")).filter(Boolean);
}

export async function countUsedPrompts(userId?: string | null): Promise<number> {
  if (!userId) return 0;
  const { count, error } = await admin()
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function appendUsedPrompt(entry: UsedPromptItem): Promise<number> {
  const promptNorm = normalizePromptText(entry.prompt);
  if (!entry.userId || !promptNorm) return countUsedPrompts(entry.userId);

  const { error } = await admin().from(TABLE).insert({
    user_id: entry.userId,
    prompt: entry.prompt,
    prompt_norm: promptNorm,
    engine: entry.engine,
    style: entry.style,
    shape: entry.shape,
    template: entry.template,
    material: entry.material,
    palette: entry.palette,
    camera: entry.camera,
    uniqueness_key: entry.uniquenessKey,
    title: entry.title,
  });

  if (error && error.code !== "23505") throw error;
  return countUsedPrompts(entry.userId);
}
