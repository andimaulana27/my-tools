import type { PaletteDef, VideoEngineId, VideoSpec } from "./types";

export const VIDEO_ENGINES: { id: VideoEngineId; label: string }[] = [
  { id: "threejs", label: "Three.js (3D PBR)" },
  { id: "pixijs", label: "PixiJS (2D Texture)" },
  { id: "p5js", label: "p5.js (Generative)" },
];

export const VIDEO_STYLES = [
  { id: "abstract", label: "Abstract" },
  { id: "neon", label: "Neon / Cyber" },
  { id: "minimalist", label: "Minimalist" },
  { id: "realistic", label: "Realistic Studio" },
  { id: "luxury", label: "Luxury" },
  { id: "organic", label: "Organic" },
  { id: "cinematic", label: "Cinematic" },
  { id: "holographic", label: "Holographic" },
  { id: "industrial", label: "Industrial" },
  { id: "ethereal", label: "Ethereal" },
] as const;

export const VIDEO_SHAPES = [
  { id: "geometric", label: "Geometric" },
  { id: "particles", label: "Particles" },
  { id: "fluid", label: "Fluid / Liquid" },
  { id: "lines", label: "Lines / Waves" },
  { id: "ribbons", label: "Ribbons" },
  { id: "crystals", label: "Crystals" },
  { id: "orbs", label: "Orbs" },
  { id: "terrain", label: "Terrain / Plane" },
  { id: "tunnel", label: "Tunnel" },
  { id: "fabric", label: "Fabric / Cloth" },
] as const;

export const THREE_TEMPLATES = [
  { id: "studio-orb", label: "Studio orb", shapes: ["orbs", "geometric"] },
  { id: "crystal-field", label: "Crystal field", shapes: ["crystals", "geometric"] },
  { id: "liquid-plane", label: "Liquid plane", shapes: ["fluid", "terrain"] },
  { id: "fabric-wave", label: "Fabric wave", shapes: ["fabric", "terrain"] },
  { id: "particle-nebula", label: "Particle nebula", shapes: ["particles"] },
  { id: "hud-rings", label: "HUD rings", shapes: ["geometric", "lines"] },
  { id: "marble-monument", label: "Marble monument", shapes: ["geometric", "orbs"] },
  { id: "iridescent-ribbon", label: "Iridescent ribbon", shapes: ["ribbons", "lines"] },
  { id: "caustic-pool", label: "Caustic pool", shapes: ["fluid", "terrain"] },
  { id: "carbon-tunnel", label: "Carbon tunnel", shapes: ["tunnel", "geometric"] },
] as const;

export const PIXI_TEMPLATES = [
  { id: "displacement-aurora", label: "Displacement aurora" },
  { id: "glow-constellation", label: "Glow constellation" },
  { id: "caustic-scroll", label: "Caustic scroll" },
  { id: "kaleido-bloom", label: "Kaleido bloom" },
  { id: "ribbon-light", label: "Ribbon light" },
  { id: "hex-pulse", label: "Hex pulse" },
] as const;

export const P5_TEMPLATES = [
  { id: "ink-flow", label: "Ink flow field" },
  { id: "layered-fog", label: "Layered fog" },
  { id: "geometry-breath", label: "Geometry breath" },
  { id: "ribbon-swarm", label: "Ribbon swarm" },
  { id: "crystal-grid", label: "Crystal grid" },
  { id: "organic-pulse", label: "Organic pulse" },
] as const;

export const MATERIALS = [
  { id: "brushed-steel", label: "Brushed steel" },
  { id: "gold-luxury", label: "Luxury gold" },
  { id: "iridescent", label: "Iridescent" },
  { id: "italian-marble", label: "Italian marble" },
  { id: "ice-glass", label: "Ice glass" },
  { id: "carbon-fiber", label: "Carbon fiber" },
  { id: "velvet", label: "Velvet" },
  { id: "lava", label: "Lava emissive" },
  { id: "pearl", label: "Pearl" },
  { id: "copper-patina", label: "Copper patina" },
  { id: "neon-emissive", label: "Neon emissive" },
  { id: "matte-clay", label: "Matte clay" },
] as const;

export const CAMERAS = [
  { id: "orbit-hero", label: "Orbit hero" },
  { id: "dolly-push", label: "Dolly push" },
  { id: "crane-rise", label: "Crane rise" },
  { id: "locked-studio", label: "Locked studio" },
  { id: "drift-strafe", label: "Drift strafe" },
  { id: "top-spin", label: "Top spin" },
] as const;

export const PALETTES: PaletteDef[] = [
  { id: "obsidian-gold", label: "Obsidian gold", bg: "#070604", a: "#d4af37", b: "#8a6a22", c: "#f3e6c0" },
  { id: "arctic-silver", label: "Arctic silver", bg: "#07090c", a: "#c9d4df", b: "#6f7f90", c: "#eef5fb" },
  { id: "void-magenta", label: "Void magenta", bg: "#07040a", a: "#ff2d95", b: "#6b1fff", c: "#ffd1ee" },
  { id: "forest-jade", label: "Forest jade", bg: "#050907", a: "#3ed9a0", b: "#0f5c48", c: "#d7ffe8" },
  { id: "champagne-noir", label: "Champagne noir", bg: "#0b0907", a: "#e8d5b5", b: "#8d6e4e", c: "#fff6e8" },
  { id: "cobalt-ice", label: "Cobalt ice", bg: "#04060d", a: "#3aa0ff", b: "#163a7a", c: "#d6ecff" },
  { id: "ember-rust", label: "Ember rust", bg: "#0c0604", a: "#ff6a22", b: "#7a2a10", c: "#ffd0b3" },
  { id: "pearl-blush", label: "Pearl blush", bg: "#0c090b", a: "#f4c4d7", b: "#8a5a6e", c: "#fff0f5" },
  { id: "graphite-cyan", label: "Graphite cyan", bg: "#070809", a: "#2ee9d6", b: "#3d4a52", c: "#d7fff8" },
  { id: "ivory-ink", label: "Ivory ink", bg: "#0b0b0c", a: "#f2efe6", b: "#6e6a62", c: "#ffffff" },
  { id: "royal-amethyst", label: "Royal amethyst", bg: "#08060d", a: "#b57bff", b: "#4a237a", c: "#ead9ff" },
  { id: "olive-brass", label: "Olive brass", bg: "#090807", a: "#c6b26a", b: "#4f5c32", c: "#efe7c4" },
];

export const ADOBE_RESOLUTIONS = [
  { w: 3840, h: 2160, label: "4K UHD 16:9 (Adobe native)" },
  { w: 2160, h: 3840, label: "4K UHD 9:16 vertical" },
  { w: 2160, h: 2160, label: "4K square 1:1" },
  { w: 1920, h: 1080, label: "HD 16:9" },
  { w: 1080, h: 1920, label: "HD 9:16 vertical" },
] as const;

export const MIN_DURATION_SEC = 5;
export const MAX_DURATION_SEC = 60;

export const STYLE_IDS = VIDEO_STYLES.map((s) => s.id);
export const SHAPE_IDS = VIDEO_SHAPES.map((s) => s.id);
export const MATERIAL_IDS = MATERIALS.map((m) => m.id);
export const CAMERA_IDS = CAMERAS.map((c) => c.id);
export const PALETTE_IDS = PALETTES.map((p) => p.id);
export const THREE_TEMPLATE_IDS = THREE_TEMPLATES.map((t) => t.id);
export const PIXI_TEMPLATE_IDS = PIXI_TEMPLATES.map((t) => t.id);
export const P5_TEMPLATE_IDS = P5_TEMPLATES.map((t) => t.id);

export function templatesForEngine(engine: VideoEngineId): string[] {
  if (engine === "pixijs") return [...PIXI_TEMPLATE_IDS];
  if (engine === "p5js") return [...P5_TEMPLATE_IDS];
  return [...THREE_TEMPLATE_IDS];
}

export function getPalette(id: string): PaletteDef {
  return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

export function preferredTemplate(engine: VideoEngineId, shape: string): string {
  if (engine === "pixijs") {
    if (shape === "particles") return "glow-constellation";
    if (shape === "fluid") return "caustic-scroll";
    if (shape === "ribbons" || shape === "lines") return "ribbon-light";
    if (shape === "geometric") return "hex-pulse";
    return PIXI_TEMPLATE_IDS[0];
  }
  if (engine === "p5js") {
    if (shape === "particles" || shape === "fluid") return "ink-flow";
    if (shape === "geometric" || shape === "crystals") return "crystal-grid";
    if (shape === "ribbons" || shape === "lines") return "ribbon-swarm";
    if (shape === "fabric") return "organic-pulse";
    return P5_TEMPLATE_IDS[0];
  }
  const hit = THREE_TEMPLATES.find((t) => (t.shapes as readonly string[]).includes(shape));
  return hit?.id ?? "studio-orb";
}

export function catalogForPrompt(engine: VideoEngineId): string {
  const templates = templatesForEngine(engine).join(", ");
  return [
    `Templates (${engine}): ${templates}`,
    `Materials: ${MATERIAL_IDS.join(", ")}`,
    `Palettes: ${PALETTE_IDS.join(", ")}`,
    `Cameras: ${CAMERA_IDS.join(", ")}`,
  ].join("\n");
}

export function clampDuration(value: number): number {
  if (!Number.isFinite(value)) return 10;
  return Math.min(MAX_DURATION_SEC, Math.max(MIN_DURATION_SEC, Math.round(value)));
}

export function isValidEngine(value: string): value is VideoEngineId {
  return value === "threejs" || value === "pixijs" || value === "p5js";
}

export function hasId(list: readonly string[], id: string): boolean {
  return list.includes(id);
}

export function uniquenessKey(spec: Pick<VideoSpec, "engine" | "template" | "material" | "palette">): string {
  return `${spec.engine}|${spec.template}|${spec.material}|${spec.palette}`;
}

export function fingerprintLabel(spec: Pick<VideoSpec, "engine" | "template" | "material" | "palette" | "camera" | "seed">): string {
  return `${uniquenessKey(spec)}|${spec.camera}|${spec.seed}`;
}
