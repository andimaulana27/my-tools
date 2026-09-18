import type { VideoEngineId } from "./types";

export type StockPrompt = {
  id: string;
  engine: VideoEngineId;
  style: string;
  shape: string;
  buyer: string;
  prompt: string;
};

export const STOCK_PROMPT_BANK: StockPrompt[] = [
  {
    id: "gold-jewelry-orb",
    engine: "threejs",
    style: "luxury",
    shape: "orbs",
    buyer: "jewelry / cosmetics hero",
    prompt: "Seamless studio loop of a luxury gold sphere with brushed metal micro-scratches, warm rim light, slow orbit, jewelry commercial background, no text",
  },
  {
    id: "obsidian-marble-monument",
    engine: "threejs",
    style: "cinematic",
    shape: "geometric",
    buyer: "architecture / luxury real estate",
    prompt: "Dark cinematic loop of an Italian marble monument on a glossy black floor, soft museum lighting, slow crane, premium architecture title bed, no logos",
  },
  {
    id: "ice-glass-orb",
    engine: "threejs",
    style: "ethereal",
    shape: "orbs",
    buyer: "wellness / spa / skincare",
    prompt: "Ethereal ice-glass orb with internal refraction and pearl highlights, cool studio environment, gentle rotation, spa skincare background, seamless loop",
  },
  {
    id: "velvet-fabric-wave",
    engine: "threejs",
    style: "luxury",
    shape: "fabric",
    buyer: "fashion / perfume",
    prompt: "Slow looping velvet fabric wave with deep burgundy sheen and champagne highlights, fashion runway title background, cinematic light graze, no garments of people",
  },
  {
    id: "carbon-auto-tunnel",
    engine: "threejs",
    style: "industrial",
    shape: "tunnel",
    buyer: "automotive / tech product",
    prompt: "Forward-drifting carbon fiber tunnel with clearcoat weave texture, automotive commercial loop, graphite lighting, seamless 4K background, no cars",
  },
  {
    id: "copper-patina-crystals",
    engine: "threejs",
    style: "organic",
    shape: "crystals",
    buyer: "wine / craft luxury",
    prompt: "Field of copper-patina crystals growing from a dark terrain, warm cellar lighting, slow orbit, artisanal luxury background, seamless loop",
  },
  {
    id: "iridescent-ribbon-fashion",
    engine: "threejs",
    style: "holographic",
    shape: "ribbons",
    buyer: "beauty / nightlife",
    prompt: "Iridescent silk ribbon looping in studio darkness, holographic thickness shift magenta to teal, beauty campaign background, no text no logos",
  },
  {
    id: "caustic-pool-wellness",
    engine: "threejs",
    style: "organic",
    shape: "fluid",
    buyer: "spa / travel / water",
    prompt: "Overhead caustic water pool with slow liquid displacement, sunlight patterns on shallow floor, wellness resort loop, calm and premium",
  },
  {
    id: "pearl-liquid-plane",
    engine: "threejs",
    style: "minimalist",
    shape: "terrain",
    buyer: "cosmetics / dental / clean tech",
    prompt: "Minimal pearl-white liquid plane undulating under soft north light, clean medical-cosmetic background, seamless loop, no instruments",
  },
  {
    id: "hud-fintech-rings",
    engine: "threejs",
    style: "neon",
    shape: "geometric",
    buyer: "fintech / AI / corporate",
    prompt: "Precision HUD rings in cobalt ice metal, slow locked-studio rotation, corporate AI data title bed, expensive not cheap neon spam, no numbers",
  },
  {
    id: "lava-ember-orb",
    engine: "threejs",
    style: "cinematic",
    shape: "orbs",
    buyer: "energy / cinematic opener",
    prompt: "Cinematic molten orb with lava emissive cracks and ember sparks held in darkness, slow orbit, film opener background, seamless loop, no planets named",
  },
  {
    id: "clay-soft-monument",
    engine: "threejs",
    style: "minimalist",
    shape: "geometric",
    buyer: "education / wellness brand",
    prompt: "Matte clay abstract monument, soft daylight studio, slow dolly, calm editorial background for education or organic brand, seamless loop",
  },
  {
    id: "steel-particle-nebula",
    engine: "threejs",
    style: "industrial",
    shape: "particles",
    buyer: "manufacturing / engineering",
    prompt: "Brushed-steel particle nebula drifting in a dark hangar, industrial documentary background, subtle bloom, seamless loop, no factories or people",
  },
  {
    id: "amethyst-crystal-luxury",
    engine: "threejs",
    style: "luxury",
    shape: "crystals",
    buyer: "jewelry / spiritual luxury",
    prompt: "Royal amethyst crystal cluster on black velvet light, slow top-spin, high-end gem commercial loop, iridescent facets, no brand cuts",
  },
  {
    id: "olive-brass-orb",
    engine: "threejs",
    style: "realistic",
    shape: "orbs",
    buyer: "interior / furniture",
    prompt: "Realistic studio orb in olive brass metal on a marble disc, interior design title background, locked hero light, seamless loop",
  },
  {
    id: "blush-pearl-ribbon",
    engine: "threejs",
    style: "ethereal",
    shape: "ribbons",
    buyer: "wedding / feminine luxury",
    prompt: "Pearl blush iridescent ribbon looping like silk in soft fog, wedding luxury title bed, gentle camera drift, no people no rings",
  },
  {
    id: "jade-liquid-caustic",
    engine: "threejs",
    style: "organic",
    shape: "fluid",
    buyer: "green beauty / tea / spa",
    prompt: "Forest jade caustic liquid surface with slow waves, organic skincare background, wet stone highlights, seamless loop",
  },
  {
    id: "graphite-hud-lines",
    engine: "threejs",
    style: "minimalist",
    shape: "lines",
    buyer: "saas / cybersecurity",
    prompt: "Minimal graphite HUD rings and thin luminous lines, cyan accent, locked studio, cybersecurity corporate loop, no readable UI text",
  },
  {
    id: "champagne-fabric",
    engine: "threejs",
    style: "cinematic",
    shape: "fabric",
    buyer: "perfume / evening wear",
    prompt: "Champagne noir fabric wave with velvet sheen, cinematic side light, perfume commercial background, slow seamless loop",
  },
  {
    id: "ice-crystal-field",
    engine: "threejs",
    style: "ethereal",
    shape: "crystals",
    buyer: "winter / vodka / dental",
    prompt: "Ice-glass crystal field on arctic silver ground, cold rim light, slow orbit, winter luxury background, seamless loop, no snowflakes cliché clutter",
  },
  {
    id: "pixi-aurora-wellness",
    engine: "pixijs",
    style: "ethereal",
    shape: "fluid",
    buyer: "meditation / app intro",
    prompt: "Soft displacement aurora in pearl and jade, slow texture scroll, meditation app background, seamless loop, no symbols",
  },
  {
    id: "pixi-constellation-night",
    engine: "pixijs",
    style: "cinematic",
    shape: "particles",
    buyer: "event / awards",
    prompt: "Awards-night glow constellation on void magenta, elegant particle drift with bloom, cinematic event background, seamless loop, no stage",
  },
  {
    id: "pixi-caustic-scroll",
    engine: "pixijs",
    style: "organic",
    shape: "fluid",
    buyer: "travel / pool / hotel",
    prompt: "Looping caustic light scroll like sun on water, cobalt ice palette, hotel travel background, premium not cartoon, seamless",
  },
  {
    id: "pixi-kaleido-luxury",
    engine: "pixijs",
    style: "luxury",
    shape: "geometric",
    buyer: "jewelry macro b-roll",
    prompt: "Slow kaleido bloom of gold and ivory facets, jewelry macro b-roll feeling, luxurious not rave, seamless loop",
  },
  {
    id: "pixi-ribbon-light",
    engine: "pixijs",
    style: "holographic",
    shape: "ribbons",
    buyer: "music / nightlife brand",
    prompt: "Holographic ribbon light waves across a dark frame, nightlife brand background, smooth loop, no lyrics no logos",
  },
  {
    id: "pixi-hex-tech",
    engine: "pixijs",
    style: "industrial",
    shape: "geometric",
    buyer: "engineering / battery / EV",
    prompt: "Hex pulse grid in graphite cyan, industrial tech background, slow breathing scale, seamless loop, no circuit copyright traces",
  },
  {
    id: "pixi-blush-particles",
    engine: "pixijs",
    style: "minimalist",
    shape: "particles",
    buyer: "skincare / feminine brand",
    prompt: "Minimal blush particle glow on black, soft constellation for skincare intro, slow drift, seamless loop",
  },
  {
    id: "pixi-ember-aurora",
    engine: "pixijs",
    style: "cinematic",
    shape: "fluid",
    buyer: "whisky / autumn brand",
    prompt: "Ember rust displacement aurora, cinematic warmth, whisky or autumn campaign background, seamless texture loop",
  },
  {
    id: "p5-ink-corporate",
    engine: "p5js",
    style: "minimalist",
    shape: "fluid",
    buyer: "editorial / publishing",
    prompt: "Ivory ink flow field on black, editorial publishing background, looping noise, quiet and expensive, no letters",
  },
  {
    id: "p5-jade-fog",
    engine: "p5js",
    style: "organic",
    shape: "particles",
    buyer: "tea / forest wellness",
    prompt: "Layered forest jade fog particles, slow organic pulse, tea ceremony atmosphere, seamless loop",
  },
  {
    id: "p5-geometry-breath",
    engine: "p5js",
    style: "abstract",
    shape: "geometric",
    buyer: "architecture / gallery",
    prompt: "Geometry breath grid of thin gold lines on noir, gallery installation background, looping rotation, no text",
  },
  {
    id: "p5-ribbon-swarm",
    engine: "p5js",
    style: "ethereal",
    shape: "ribbons",
    buyer: "dance / arts",
    prompt: "Ethereal ribbon swarm in amethyst light, generative dance-arts background, seamless looping trails",
  },
  {
    id: "p5-crystal-grid",
    engine: "p5js",
    style: "holographic",
    shape: "crystals",
    buyer: "science / lab brand",
    prompt: "Holographic crystal grid pulsing on dark lab black, science brand background, looping, no formulas",
  },
  {
    id: "p5-organic-pulse",
    engine: "p5js",
    style: "organic",
    shape: "fabric",
    buyer: "sustainable fashion",
    prompt: "Organic pulse like living textile fibers, olive brass tones, sustainable fashion background, seamless loop",
  },
  {
    id: "p5-cobalt-flow",
    engine: "p5js",
    style: "neon",
    shape: "lines",
    buyer: "data / maps / night city",
    prompt: "Cobalt ice ink-flow lines suggesting night data streams, premium not sci-fi clutter, seamless loop, no readable maps",
  },
  {
    id: "p5-ivory-grid",
    engine: "p5js",
    style: "minimalist",
    shape: "geometric",
    buyer: "museum / luxury print",
    prompt: "Ivory geometric breath on ink black, museum title card background, slow loop, print-like restraint",
  },
];

function scorePrompt(entry: StockPrompt, engine: string, style: string, shape: string): number {
  let score = 0;
  if (entry.engine === engine) score += 8;
  if (entry.style === style) score += 4;
  if (entry.shape === shape) score += 4;
  return score;
}

function normPrompt(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function pickStockPrompt(
  engine: string,
  style: string,
  shape: string,
  recentPrompts: string[] = []
): StockPrompt | null {
  const used = new Set(recentPrompts.map((item) => normPrompt(item)).filter(Boolean));
  const unused = STOCK_PROMPT_BANK.filter((entry) => !used.has(normPrompt(entry.prompt)));
  const pool = (unused.length > 0 ? unused : STOCK_PROMPT_BANK)
    .map((entry) => ({ entry, score: scorePrompt(entry, engine, style, shape) }))
    .sort((a, b) => b.score - a.score);

  const bestScore = pool[0]?.score ?? 0;
  const top = pool.filter((item) => item.score === bestScore || item.score >= bestScore - 4);
  if (top.length === 0) return null;
  return top[Math.floor(Math.random() * Math.min(top.length, 6))].entry;
}

export function promptBankForGemini(engine: string, style: string, shape: string): string {
  return STOCK_PROMPT_BANK
    .filter((entry) => entry.engine === engine)
    .filter((entry) => entry.style === style || entry.shape === shape)
    .slice(0, 8)
    .map((entry) => `- ${entry.buyer}: ${entry.prompt}`)
    .join("\n");
}
