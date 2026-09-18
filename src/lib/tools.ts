export type ToolItem = {
  index: string;
  title: string;
  kicker: string;
  summary: string;
  href: string;
  extra?: string;
};

export const TOOLS: ToolItem[] = [
  {
    index: "01",
    title: "Metadata",
    kicker: "Adobe · Canva · naming",
    summary: "Judul SEO, keyword volume tinggi, dan logika penamaan file untuk microstock.",
    href: "/metadata",
    extra: "Engine",
  },
  {
    index: "02",
    title: "Asset generator",
    kicker: "Imagen batch",
    summary: "Sticker sheet dan aset visual massal dalam satu kanvas, hemat kuota API.",
    href: "/image-engine",
    extra: "Engine",
  },
  {
    index: "03",
    title: "Video stock",
    kicker: "Three.js · Pixi · p5",
    summary: "Loop 4K native dengan spec unik, PBR, dan CSV metadata Adobe Stock.",
    href: "/video-engine",
    extra: "Engine",
  },
  {
    index: "04",
    title: "Pro converter",
    kicker: "Convert · upscale · compress",
    summary: "Hapus background, kompresi, konversi format, dan upscale GPU.",
    href: "/converter",
    extra: "Utility",
  },
  {
    index: "05",
    title: "Voice studio",
    kicker: "TTS multibahasa",
    summary: "Naskah ke suara natural dengan kendali pitch dan kecepatan.",
    href: "/voice-studio",
    extra: "Engine",
  },
  {
    index: "06",
    title: "YouTube SEO",
    kicker: "Live + retro titles",
    summary: "Judul, deskripsi, dan tag untuk live stream game Retro dan AAA.",
    href: "/youtube-seo",
    extra: "Engine",
  },
  {
    index: "07",
    title: "SaaS blueprint",
    kicker: "Architecture",
    summary: "Dari ide mentah ke fitur, schema database, dan rekomendasi stack.",
    href: "/saas-blueprint",
    extra: "Studio",
  },
  {
    index: "08",
    title: "UI/UX engine",
    kicker: "Layout + copy",
    summary: "Kerangka halaman, komponen, dan copywriting siap desain.",
    href: "/uiux-engine",
    extra: "Studio",
  },
];

export const USER_NAV = [
  { name: "Workspace", href: "/dashboard" },
  { name: "Metadata", href: "/metadata" },
  { name: "Assets", href: "/image-engine" },
  { name: "Video", href: "/video-engine" },
  { name: "Converter", href: "/converter" },
  { name: "Voice", href: "/voice-studio" },
  { name: "YouTube", href: "/youtube-seo" },
  { name: "Blueprint", href: "/saas-blueprint" },
  { name: "UI/UX", href: "/uiux-engine" },
];

export const ADMIN_NAV = [
  { name: "Overview", href: "/admin/dashboard" },
  { name: "Users", href: "/admin/users" },
  { name: "Settings", href: "/admin/settings" },
];
