import { STOCK_RUNTIME_SOURCE } from "./runtime-source";
import type { ResolvedVideoSpec } from "./types";

export function buildPreviewDocument(spec: ResolvedVideoSpec): string {
  const specJson = JSON.stringify(spec).replace(/</g, "\\u003c");
  const importMap = JSON.stringify({
    imports: {
      three: "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/",
    },
  });

  return [
    "<!DOCTYPE html>",
    "<html><head>",
    '<meta charset="utf-8" />',
    `<script type="importmap">${importMap}</script>`,
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/pixi.js/7.4.2/pixi.min.js"></script>',
    '<script src="https://cdn.jsdelivr.net/npm/pixi-filters@5.3.0/dist/browser/pixi-filters.min.js"></script>',
    '<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.3/p5.min.js"></script>',
    "<style>",
    "html,body{margin:0;padding:0;background:#000;width:100%;height:100%;overflow:hidden;display:flex;align-items:center;justify-content:center;}",
    "canvas{max-width:100%;max-height:100%;width:auto!important;height:auto!important;object-fit:contain;}",
    "</style>",
    "</head><body>",
    "<script>",
    `window.STOCK_SPEC = ${specJson};`,
    "window.onerror = function(msg){ window.parent.postMessage({ type: 'error', message: String(msg) }, '*'); };",
    "</script>",
    '<script type="module">',
    "import * as THREE from 'three';",
    "import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';",
    "import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';",
    "import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';",
    "import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';",
    "window.__THREE__ = THREE;",
    "window.__THREE_ADDONS__ = { EffectComposer, RenderPass, UnrealBloomPass, OutputPass };",
    STOCK_RUNTIME_SOURCE,
    "startStockRuntime(window.STOCK_SPEC);",
    "</script>",
    "</body></html>",
  ].join("\n");
}
