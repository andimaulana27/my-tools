export type VideoEngineId = "threejs" | "pixijs" | "p5js";

export type VideoSpec = {
  engine: VideoEngineId;
  style: string;
  shape: string;
  template: string;
  material: string;
  palette: string;
  camera: string;
  seed: number;
  duration: number;
  prompt: string;
};

export type PaletteDef = {
  id: string;
  label: string;
  bg: string;
  a: string;
  b: string;
  c: string;
};

export type ResolvedVideoSpec = VideoSpec & {
  width: number;
  height: number;
  fps: number;
  paletteColors: PaletteDef;
};
