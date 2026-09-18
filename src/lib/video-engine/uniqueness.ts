import {
  CAMERA_IDS,
  MATERIAL_IDS,
  PALETTE_IDS,
  clampDuration,
  getPalette,
  hasId,
  isValidEngine,
  preferredTemplate,
  templatesForEngine,
  uniquenessKey,
} from "./catalog";
import type { ResolvedVideoSpec, VideoEngineId, VideoSpec } from "./types";

export const UNIQUENESS_STORAGE_KEY = "video-engine-uniqueness-v2";
export const MAX_STORED_KEYS = 160;
export const MAX_STORED_PROMPTS = 40;

export type UniquenessMemory = {
  keys: string[];
  prompts: string[];
};

function pick<T>(list: readonly T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length];
}

function hashedSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 1_000_000_000 || 1;
}

export function readUniquenessMemory(): UniquenessMemory {
  if (typeof window === "undefined") return { keys: [], prompts: [] };
  try {
    const raw = window.localStorage.getItem(UNIQUENESS_STORAGE_KEY);
    if (!raw) return { keys: [], prompts: [] };
    const parsed = JSON.parse(raw) as UniquenessMemory;
    return {
      keys: Array.isArray(parsed.keys) ? parsed.keys.slice(-MAX_STORED_KEYS) : [],
      prompts: Array.isArray(parsed.prompts) ? parsed.prompts.slice(-MAX_STORED_PROMPTS) : [],
    };
  } catch {
    return { keys: [], prompts: [] };
  }
}

export function writeUniquenessMemory(memory: UniquenessMemory) {
  if (typeof window === "undefined") return;
  const next: UniquenessMemory = {
    keys: memory.keys.slice(-MAX_STORED_KEYS),
    prompts: memory.prompts.slice(-MAX_STORED_PROMPTS),
  };
  window.localStorage.setItem(UNIQUENESS_STORAGE_KEY, JSON.stringify(next));
}

export function rememberGeneratedSpec(spec: VideoSpec, prompt: string) {
  const memory = readUniquenessMemory();
  const key = uniquenessKey(spec);
  writeUniquenessMemory({
    keys: [...memory.keys.filter((item) => item !== key), key],
    prompts: [...memory.prompts.filter((item) => item !== prompt), prompt].slice(-MAX_STORED_PROMPTS),
  });
}

export function normalizeSpec(raw: Partial<VideoSpec>, fallback: VideoSpec): VideoSpec {
  const engine: VideoEngineId = isValidEngine(String(raw.engine || fallback.engine))
    ? (raw.engine as VideoEngineId)
    : fallback.engine;
  const templates = templatesForEngine(engine);
  const template = hasId(templates, String(raw.template))
    ? String(raw.template)
    : preferredTemplate(engine, fallback.shape);
  const material = hasId(MATERIAL_IDS, String(raw.material)) ? String(raw.material) : fallback.material;
  const palette = hasId(PALETTE_IDS, String(raw.palette)) ? String(raw.palette) : fallback.palette;
  const camera = hasId(CAMERA_IDS, String(raw.camera)) ? String(raw.camera) : fallback.camera;
  const seedRaw = Number(raw.seed);
  const seed = Number.isFinite(seedRaw) ? Math.abs(Math.round(seedRaw)) % 1_000_000_000 || hashedSeed(template + material) : fallback.seed;

  return {
    engine,
    style: String(raw.style || fallback.style),
    shape: String(raw.shape || fallback.shape),
    template,
    material,
    palette,
    camera,
    seed,
    duration: clampDuration(Number(raw.duration || fallback.duration)),
    prompt: String(raw.prompt || fallback.prompt),
  };
}

export function ensureUniqueSpec(spec: VideoSpec, usedKeys: string[]): { spec: VideoSpec; adjusted: boolean; note: string } {
  const used = new Set(usedKeys);
  if (!used.has(uniquenessKey(spec))) {
    return { spec, adjusted: false, note: "" };
  }

  const templates = templatesForEngine(spec.engine);
  const startT = Math.max(0, templates.indexOf(spec.template));
  const startM = Math.max(0, MATERIAL_IDS.indexOf(spec.material as (typeof MATERIAL_IDS)[number]));
  const startP = Math.max(0, PALETTE_IDS.indexOf(spec.palette as (typeof PALETTE_IDS)[number]));

  for (let t = 0; t < templates.length; t += 1) {
    for (let m = 0; m < MATERIAL_IDS.length; m += 1) {
      for (let p = 0; p < PALETTE_IDS.length; p += 1) {
        const next: VideoSpec = {
          ...spec,
          template: pick(templates, startT + t),
          material: pick(MATERIAL_IDS, startM + m + t),
          palette: pick(PALETTE_IDS, startP + p + m + t),
          camera: pick(CAMERA_IDS, startT + m + p),
          seed: (spec.seed + t * 7919 + m * 104729 + p * 1301) % 1_000_000_000 || 7,
        };
        if (!used.has(uniquenessKey(next))) {
          return {
            spec: next,
            adjusted: true,
            note: `Combo sebelumnya terlalu mirip. Diganti ke ${next.template} / ${next.material} / ${next.palette} agar lolos similarity Adobe Stock.`,
          };
        }
      }
    }
  }

  return {
    spec: { ...spec, seed: (spec.seed + Date.now()) % 1_000_000_000 || 13 },
    adjusted: true,
    note: "Semua combo utama sudah terpakai. Seed baru dipakai, tapi generate konsep baru tetap lebih aman.",
  };
}

export function resolveSpec(
  spec: VideoSpec,
  size: { w: number; h: number },
  fps: number
): ResolvedVideoSpec {
  return {
    ...spec,
    width: size.w,
    height: size.h,
    fps,
    paletteColors: getPalette(spec.palette),
  };
}

export function rerollDistinct(spec: VideoSpec, usedKeys: string[]): { spec: VideoSpec; note: string } {
  const used = new Set(usedKeys.filter((key) => key !== uniquenessKey(spec)));
  const shifted: VideoSpec = {
    ...spec,
    palette: pick(PALETTE_IDS, PALETTE_IDS.indexOf(spec.palette as (typeof PALETTE_IDS)[number]) + 1),
    camera: pick(CAMERA_IDS, CAMERA_IDS.indexOf(spec.camera as (typeof CAMERA_IDS)[number]) + 1),
    seed: (spec.seed + 104729) % 1_000_000_000 || 17,
  };
  const unique = ensureUniqueSpec(shifted, [...used]);
  return {
    spec: unique.spec,
    note: unique.note || "Variasi baru: palette, camera, dan seed diganti tanpa mengubah konsep utama.",
  };
}
