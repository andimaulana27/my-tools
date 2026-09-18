export const STOCK_RUNTIME_SOURCE = `
var clockOrigin = performance.now();

function mulberry32(a) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hexToColor(hex, THREERef) {
  return new THREERef.Color(hex);
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

function hash2(ix, iy, seed) {
  var n = Math.sin(ix * 127.1 + iy * 311.7 + seed * 0.013) * 43758.5453123;
  return n - Math.floor(n);
}

function valueNoise(x, y, seed) {
  var x0 = Math.floor(x), y0 = Math.floor(y);
  var fx = x - x0, fy = y - y0;
  var ux = fx * fx * (3 - 2 * fx);
  var uy = fy * fy * (3 - 2 * fy);
  var a = hash2(x0, y0, seed);
  var b = hash2(x0 + 1, y0, seed);
  var c = hash2(x0, y0 + 1, seed);
  var d = hash2(x0 + 1, y0 + 1, seed);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, seed) {
  var v = 0, amp = 0.5, freq = 1;
  for (var i = 0; i < 5; i++) {
    v += amp * valueNoise(x * freq, y * freq, seed + i * 19);
    amp *= 0.55;
    freq *= 2.02;
  }
  return v;
}

function makeCanvasTexture(size, paint, THREERef, srgb) {
  var canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  var ctx = canvas.getContext('2d');
  var img = ctx.createImageData(size, size);
  paint(img.data, size);
  ctx.putImageData(img, 0, 0);
  var tex = new THREERef.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREERef.RepeatWrapping;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  tex.colorSpace = srgb ? THREERef.SRGBColorSpace : THREERef.NoColorSpace;
  return tex;
}

function heightToNormal(data, size, strength) {
  var out = new Uint8ClampedArray(size * size * 4);
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      var left = data[(y * size + ((x - 1 + size) % size)) * 4];
      var right = data[(y * size + ((x + 1) % size)) * 4];
      var up = data[(((y - 1 + size) % size) * size + x) * 4];
      var down = data[(((y + 1) % size) * size + x) * 4];
      var nx = (left - right) * strength;
      var ny = (up - down) * strength;
      var nz = 1.0;
      var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
      out[i] = Math.round((nx / len * 0.5 + 0.5) * 255);
      out[i + 1] = Math.round((ny / len * 0.5 + 0.5) * 255);
      out[i + 2] = Math.round((nz / len * 0.5 + 0.5) * 255);
      out[i + 3] = 255;
    }
  }
  return out;
}

function buildTextures(material, seed, THREERef) {
  var size = 1024;
  var albedo = makeCanvasTexture(size, function(data, n) {
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var i = (y * n + x) * 4;
        var u = x / n, v = y / n;
        var n1 = fbm(u * 8, v * 8, seed);
        var n2 = fbm(u * 18 + 4, v * 18, seed + 9);
        var r = 128, g = 128, b = 128;
        if (material === 'italian-marble') {
          var vein = Math.abs(Math.sin((u * 9 + n1 * 3.2) * 3.14159));
          var body = 210 + n2 * 30;
          r = body - (1 - vein) * 90;
          g = body - (1 - vein) * 95;
          b = body - (1 - vein) * 85;
        } else if (material === 'carbon-fiber') {
          var weave = ((Math.floor(x / 8) + Math.floor(y / 8)) % 2);
          var dash = Math.sin((x + y) * 0.35) * 0.5 + 0.5;
          var c = 18 + weave * 22 + dash * 18;
          r = c; g = c; b = c + 6;
        } else if (material === 'brushed-steel') {
          var streak = fbm(u * 2, v * 70, seed);
          var val = 120 + streak * 90;
          r = val; g = val + 2; b = val + 6;
        } else if (material === 'velvet') {
          var pile = Math.pow(n1, 1.4);
          r = 40 + pile * 50; g = 18 + pile * 30; b = 32 + pile * 40;
        } else if (material === 'copper-patina') {
          var pat = n1 * 0.7 + n2 * 0.3;
          r = 140 + pat * 50; g = 70 + (1 - pat) * 80; b = 40 + pat * 70;
        } else if (material === 'lava') {
          var heat = Math.pow(clamp01(n1 * 1.3), 2.2);
          r = 20 + heat * 220; g = 8 + heat * 70; b = 4;
        } else if (material === 'gold-luxury') {
          var flake = n2 * 40;
          r = 190 + flake; g = 150 + flake * 0.6; b = 55 + n1 * 20;
        } else if (material === 'pearl') {
          r = 220 + n1 * 20; g = 214 + n2 * 20; b = 230 + n1 * 15;
        } else if (material === 'ice-glass') {
          r = 190 + n1 * 40; g = 220 + n2 * 25; b = 235;
        } else if (material === 'neon-emissive') {
          var band = Math.abs(Math.sin(u * 18 + n1));
          r = 10 + band * 40; g = 10 + band * 80; b = 20 + band * 180;
        } else if (material === 'matte-clay') {
          r = 160 + n1 * 25; g = 132 + n2 * 20; b = 110 + n1 * 15;
        } else {
          r = 160 + n1 * 70; g = 160 + n2 * 70; b = 180 + n1 * 50;
        }
        data[i] = clamp01(r / 255) * 255;
        data[i + 1] = clamp01(g / 255) * 255;
        data[i + 2] = clamp01(b / 255) * 255;
        data[i + 3] = 255;
      }
    }
  }, THREERef, true);

  var rough = makeCanvasTexture(size, function(data, n) {
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var i = (y * n + x) * 4;
        var n1 = fbm(x / n * 12, y / n * 12, seed + 21);
        var v = 90;
        if (material === 'ice-glass' || material === 'pearl') v = 30 + n1 * 40;
        else if (material === 'gold-luxury' || material === 'brushed-steel') v = 50 + n1 * 70;
        else if (material === 'velvet' || material === 'matte-clay') v = 160 + n1 * 50;
        else if (material === 'italian-marble') v = 70 + n1 * 40;
        else v = 70 + n1 * 90;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
  }, THREERef, false);

  var height = makeCanvasTexture(size, function(data, n) {
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var i = (y * n + x) * 4;
        var h = fbm(x / n * 10, y / n * 10, seed + 44);
        if (material === 'carbon-fiber') h = ((x % 10) < 5 ? 0.35 : 0.7) * 0.5 + h * 0.5;
        if (material === 'brushed-steel') h = fbm(x / n * 2, y / n * 40, seed + 3);
        var v = h * 255;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
    }
  }, THREERef, false);

  var normalCanvas = document.createElement('canvas');
  normalCanvas.width = normalCanvas.height = size;
  var nctx = normalCanvas.getContext('2d');
  var hctx = document.createElement('canvas');
  hctx.width = hctx.height = size;
  var hg = hctx.getContext('2d');
  hg.drawImage(height.image, 0, 0);
  var hdata = hg.getImageData(0, 0, size, size).data;
  var ndata = nctx.createImageData(size, size);
  ndata.data.set(heightToNormal(hdata, size, 0.035));
  nctx.putImageData(ndata, 0, 0);
  var normal = new THREERef.CanvasTexture(normalCanvas);
  normal.wrapS = normal.wrapT = THREERef.RepeatWrapping;
  normal.anisotropy = 8;
  normal.colorSpace = THREERef.NoColorSpace;
  normal.needsUpdate = true;

  var emissive = makeCanvasTexture(size, function(data, n) {
    for (var y = 0; y < n; y++) {
      for (var x = 0; x < n; x++) {
        var i = (y * n + x) * 4;
        var n1 = fbm(x / n * 7, y / n * 7, seed + 70);
        var e = 0;
        if (material === 'lava') e = Math.pow(clamp01(n1 * 1.4), 2.4);
        else if (material === 'neon-emissive') e = Math.abs(Math.sin(x / n * 20.0)) * 0.8 + n1 * 0.2;
        data[i] = e * 255;
        data[i + 1] = e * (material === 'lava' ? 80 : 200);
        data[i + 2] = e * (material === 'lava' ? 20 : 255);
        data[i + 3] = 255;
      }
    }
  }, THREERef, true);

  return { albedo: albedo, rough: rough, normal: normal, emissive: emissive };
}

function makeMaterial(spec, textures, THREERef) {
  var pal = spec.paletteColors;
  var matId = spec.material;
  var base = hexToColor(pal.a, THREERef);
  var common = {
    roughnessMap: textures.rough,
    normalMap: textures.normal,
    normalScale: new THREERef.Vector2(0.55, 0.55),
    envMapIntensity: spec.style === 'minimalist' ? 0.8 : 1.25
  };

  if (matId === 'ice-glass') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      color: hexToColor(pal.c, THREERef),
      metalness: 0.02,
      roughness: 0.06,
      transmission: 0.9,
      thickness: 1.6,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      attenuationColor: hexToColor(pal.b, THREERef),
      attenuationDistance: 2.4
    }));
  }
  if (matId === 'iridescent') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      color: 0xffffff,
      metalness: 0.85,
      roughness: 0.2,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 480],
      clearcoat: 0.7,
      clearcoatRoughness: 0.15
    }));
  }
  if (matId === 'gold-luxury' || matId === 'brushed-steel' || matId === 'copper-patina') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      map: textures.albedo,
      color: 0xffffff,
      metalness: 1,
      roughness: matId === 'gold-luxury' ? 0.16 : 0.28,
      clearcoat: 0.28,
      anisotropy: matId === 'brushed-steel' ? 0.85 : 0.2,
      anisotropyRotation: Math.PI / 2
    }));
  }
  if (matId === 'italian-marble' || matId === 'pearl') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      map: textures.albedo,
      metalness: 0.04,
      roughness: 0.28,
      clearcoat: 0.55,
      clearcoatRoughness: 0.18,
      sheen: matId === 'pearl' ? 0.4 : 0
    }));
  }
  if (matId === 'velvet') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      map: textures.albedo,
      color: base,
      metalness: 0,
      roughness: 0.78,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: hexToColor(pal.c, THREERef)
    }));
  }
  if (matId === 'carbon-fiber') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      map: textures.albedo,
      metalness: 0.7,
      roughness: 0.32,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12
    }));
  }
  if (matId === 'lava' || matId === 'neon-emissive') {
    return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
      map: textures.albedo,
      metalness: 0.2,
      roughness: 0.35,
      emissive: hexToColor(pal.a, THREERef),
      emissiveMap: textures.emissive,
      emissiveIntensity: spec.style === 'minimalist' ? 0.8 : 1.8
    }));
  }
  return new THREERef.MeshPhysicalMaterial(Object.assign({}, common, {
    map: textures.albedo,
    color: base,
    metalness: 0.08,
    roughness: 0.62
  }));
}

function makeStudioEnv(renderer, spec, THREERef) {
  var pal = spec.paletteColors;
  var envScene = new THREERef.Scene();
  envScene.background = hexToColor(pal.bg, THREERef);
  var sky = new THREERef.Mesh(
    new THREERef.SphereGeometry(12, 24, 24),
    new THREERef.MeshBasicMaterial({ color: pal.b, side: THREERef.BackSide })
  );
  envScene.add(sky);

  function panel(x, y, z, w, h, hex, rx, ry) {
    var mesh = new THREERef.Mesh(
      new THREERef.PlaneGeometry(w, h),
      new THREERef.MeshBasicMaterial({ color: hex, side: THREERef.DoubleSide })
    );
    mesh.position.set(x, y, z);
    mesh.rotation.x = rx || 0;
    mesh.rotation.y = ry || 0;
    envScene.add(mesh);
  }
  panel(-6, 3, 2, 4, 6, pal.c, 0, Math.PI / 2);
  panel(6, 2.5, -1, 3.5, 5, pal.a, 0, -Math.PI / 2);
  panel(0, 7, 0, 8, 3, '#ffffff', Math.PI / 2, 0);

  var pmrem = new THREERef.PMREMGenerator(renderer);
  var envMap = pmrem.fromScene(envScene, 0.04).texture;
  pmrem.dispose();
  return envMap;
}

function addStudioLights(scene, spec, THREERef) {
  var pal = spec.paletteColors;
  scene.add(new THREERef.AmbientLight(0xffffff, 0.18));
  var hemi = new THREERef.HemisphereLight(pal.c, pal.bg, 0.45);
  scene.add(hemi);
  var key = new THREERef.DirectionalLight(0xffffff, 2.1);
  key.position.set(4.5, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  scene.add(key);
  var fill = new THREERef.DirectionalLight(pal.c, 0.7);
  fill.position.set(-6, 3, -2);
  scene.add(fill);
  var rim = new THREERef.DirectionalLight(pal.a, 1.1);
  rim.position.set(-2, 4, -6);
  scene.add(rim);
}

function placeCamera(cam, type, u, spec) {
  var a = u * Math.PI * 2;
  var dist = spec.style === 'minimalist' ? 6.2 : 5.4;
  var x = 0, y = 1.6, z = dist;
  if (type === 'orbit-hero') {
    x = Math.cos(a) * dist;
    z = Math.sin(a) * dist;
    y = 1.5 + Math.sin(a * 2) * 0.28;
  } else if (type === 'dolly-push') {
    var d = dist + Math.sin(a) * 1.15;
    x = Math.cos(0.4) * d;
    z = Math.sin(0.4) * d;
    y = 1.7;
  } else if (type === 'crane-rise') {
    x = Math.cos(a * 0.5) * 4.6;
    z = Math.sin(a * 0.5) * 4.6;
    y = 0.9 + (Math.sin(a) * 0.5 + 0.5) * 2.4;
  } else if (type === 'locked-studio') {
    x = 4.2; y = 2.1; z = 4.8;
  } else if (type === 'drift-strafe') {
    x = Math.cos(a) * 5.2;
    z = 4.4 + Math.sin(a) * 0.8;
    y = 1.8 + Math.cos(a) * 0.2;
  } else {
    x = Math.cos(a) * 0.6;
    z = 0.2;
    y = 7.2;
  }
  cam.position.set(x, y, z);
  cam.lookAt(0, 0.6, 0);
}

function attachLoopDisplacement(material, amp) {
  material.userData.uTime = { value: 0 };
  material.customProgramCacheKey = function() { return 'stock-disp-' + amp; };
  material.onBeforeCompile = function(shader) {
    shader.uniforms.uTime = material.userData.uTime;
    shader.vertexShader = 'uniform float uTime;\\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      [
        'float t = uTime * 6.28318530718;',
        'vec3 transformed = vec3(position);',
        'transformed.z += sin(position.x * 1.7 + t) * ' + amp + ';',
        'transformed.z += cos(position.y * 1.3 - t) * ' + (amp * 0.65) + ';'
      ].join('\\n')
    );
  };
}

function buildThreeScene(spec, THREERef) {
  var rng = mulberry32(spec.seed);
  var textures = buildTextures(spec.material, spec.seed, THREERef);
  var material = makeMaterial(spec, textures, THREERef);
  var scene = new THREERef.Scene();
  scene.background = hexToColor(spec.paletteColors.bg, THREERef);
  scene.fog = new THREERef.Fog(spec.paletteColors.bg, 8, spec.template === 'carbon-tunnel' ? 22 : 16);
  var camera = new THREERef.PerspectiveCamera(35, spec.width / spec.height, 0.1, 80);
  var group = new THREERef.Group();
  scene.add(group);
  var extras = [];

  var template = spec.template;
  if (template === 'crystal-field') {
    var geo = new THREERef.OctahedronGeometry(0.28, 0);
    var count = spec.width >= 3840 ? 90 : 120;
    var mesh = new THREERef.InstancedMesh(geo, material, count);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    var dummy = new THREERef.Object3D();
    for (var i = 0; i < count; i++) {
      dummy.position.set((rng() - 0.5) * 8, rng() * 2.2, (rng() - 0.5) * 8);
      dummy.rotation.set(rng() * Math.PI, rng() * Math.PI, rng() * Math.PI);
      var s = 0.4 + rng() * 1.6;
      dummy.scale.set(s, s * (1.2 + rng()), s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    group.add(mesh);
  } else if (template === 'liquid-plane' || template === 'caustic-pool' || template === 'fabric-wave') {
    var seg = spec.width >= 3840 ? 96 : 128;
    var plane = new THREERef.Mesh(new THREERef.PlaneGeometry(9, 9, seg, seg), material);
    plane.rotation.x = -Math.PI / 2;
    plane.receiveShadow = true;
    plane.castShadow = true;
    attachLoopDisplacement(material, template === 'fabric-wave' ? 0.18 : 0.22);
    group.add(plane);
    if (template === 'caustic-pool') {
      var orb = new THREERef.Mesh(new THREERef.IcosahedronGeometry(0.9, 3), material.clone());
      orb.position.y = 1.1;
      orb.castShadow = true;
      group.add(orb);
      extras.push(orb);
    }
  } else if (template === 'particle-nebula') {
    var n = spec.width >= 3840 ? 11000 : 16000;
    var pos = new Float32Array(n * 3);
    var col = new Float32Array(n * 3);
    var c1 = hexToColor(spec.paletteColors.a, THREERef);
    var c2 = hexToColor(spec.paletteColors.c, THREERef);
    for (var p = 0; p < n; p++) {
      var r = Math.pow(rng(), 0.55) * 4.2;
      var th = rng() * Math.PI * 2;
      var ph = Math.acos(2 * rng() - 1);
      pos[p * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[p * 3 + 1] = r * Math.cos(ph) * 0.7;
      pos[p * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
      var mixv = rng();
      col[p * 3] = c1.r + (c2.r - c1.r) * mixv;
      col[p * 3 + 1] = c1.g + (c2.g - c1.g) * mixv;
      col[p * 3 + 2] = c1.b + (c2.b - c1.b) * mixv;
    }
    var bg = new THREERef.BufferGeometry();
    bg.setAttribute('position', new THREERef.BufferAttribute(pos, 3));
    bg.setAttribute('color', new THREERef.BufferAttribute(col, 3));
    var pm = new THREERef.PointsMaterial({
      size: spec.width >= 3840 ? 0.035 : 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      blending: THREERef.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    group.add(new THREERef.Points(bg, pm));
  } else if (template === 'hud-rings') {
    for (var h = 0; h < 6; h++) {
      var torus = new THREERef.Mesh(new THREERef.TorusGeometry(0.8 + h * 0.38, 0.018, 16, 96), material);
      torus.rotation.x = Math.PI / 2 * (h % 2 === 0 ? 1 : 0.15);
      torus.castShadow = true;
      group.add(torus);
      extras.push(torus);
    }
  } else if (template === 'marble-monument') {
    var body = new THREERef.Mesh(new THREERef.CapsuleGeometry(0.7, 1.6, 8, 16), material);
    body.position.y = 1.1;
    body.castShadow = true;
    body.receiveShadow = true;
    var base = new THREERef.Mesh(new THREERef.CylinderGeometry(1.4, 1.6, 0.28, 32), material);
    base.receiveShadow = true;
    var cap = new THREERef.Mesh(new THREERef.SphereGeometry(0.55, 48, 32), material);
    cap.position.y = 2.4;
    cap.castShadow = true;
    group.add(body); group.add(base); group.add(cap);
    extras.push(body, cap);
  } else if (template === 'iridescent-ribbon') {
    var pts = [];
    for (var k = 0; k < 40; k++) {
      var t = k / 39 * Math.PI * 2;
      pts.push(new THREERef.Vector3(Math.cos(t) * 2.1, Math.sin(t * 3) * 0.85, Math.sin(t) * 2.1));
    }
    var curve = new THREERef.CatmullRomCurve3(pts, true);
    var tube = new THREERef.Mesh(new THREERef.TubeGeometry(curve, 240, 0.14, 24, true), material);
    tube.castShadow = true;
    group.add(tube);
    extras.push(tube);
  } else if (template === 'carbon-tunnel') {
    var tun = new THREERef.Mesh(new THREERef.CylinderGeometry(2.3, 2.3, 14, 48, 1, true), material);
    tun.rotation.x = Math.PI / 2;
    material.side = THREERef.BackSide;
    group.add(tun);
    extras.push(tun);
  } else {
    var sphere = new THREERef.Mesh(new THREERef.IcosahedronGeometry(1.15, 4), material);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    sphere.position.y = 1.15;
    var ring = new THREERef.Mesh(new THREERef.TorusGeometry(1.7, 0.045, 16, 80), material.clone());
    ring.rotation.x = Math.PI / 2.3;
    ring.position.y = 1.15;
    var floor = new THREERef.Mesh(new THREERef.CircleGeometry(6, 64), material.clone());
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    group.add(sphere); group.add(ring); group.add(floor);
    extras.push(sphere, ring);
  }

  return { scene: scene, camera: camera, group: group, extras: extras, material: material };
}

async function runThree(spec, THREERef, addons) {
  var renderer = new THREERef.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(spec.width, spec.height, false);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREERef.SRGBColorSpace;
  renderer.toneMapping = THREERef.ACESFilmicToneMapping;
  renderer.toneMappingExposure = spec.style === 'cinematic' ? 0.95 : 1.08;
  renderer.shadowMap.enabled = spec.template !== 'particle-nebula';
  renderer.shadowMap.type = THREERef.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  var built = buildThreeScene(spec, THREERef);
  built.scene.environment = makeStudioEnv(renderer, spec, THREERef);
  addStudioLights(built.scene, spec, THREERef);

  var composer = new addons.EffectComposer(renderer);
  composer.setPixelRatio(1);
  composer.setSize(spec.width, spec.height);
  composer.addPass(new addons.RenderPass(built.scene, built.camera));
  var bloomStrength = spec.style === 'neon' || spec.style === 'holographic' || spec.material === 'lava' || spec.material === 'neon-emissive' ? 0.46 : 0.28;
  if (spec.style === 'minimalist') bloomStrength *= 0.55;
  var bloom = new addons.UnrealBloomPass(
    new THREERef.Vector2(Math.min(spec.width, 1600), Math.min(spec.height, 900)),
    bloomStrength,
    0.55,
    0.82
  );
  composer.addPass(bloom);
  composer.addPass(new addons.OutputPass());

  function tick() {
    requestAnimationFrame(tick);
    var u = window.StockRuntime.loopU();
    if (built.material.userData.uTime) built.material.userData.uTime.value = u;
    built.group.rotation.y = spec.template === 'carbon-tunnel' ? u * Math.PI * 2 : Math.sin(u * Math.PI * 2) * 0.15;
    for (var i = 0; i < built.extras.length; i++) {
      built.extras[i].rotation.z = u * Math.PI * 2 * (i % 2 === 0 ? 0.2 : -0.15);
    }
    placeCamera(built.camera, spec.camera, u, spec);
    composer.render();
  }
  tick();
}

function noiseCanvas(size, seed, scale) {
  var c = document.createElement('canvas');
  c.width = c.height = size;
  var ctx = c.getContext('2d');
  var img = ctx.createImageData(size, size);
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var i = (y * size + x) * 4;
      var n = fbm(x / size * scale, y / size * scale, seed);
      var v = n * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

function runPixi(spec) {
  var PIXIRef = window.PIXI;
  var app = new PIXIRef.Application({
    width: spec.width,
    height: spec.height,
    backgroundColor: parseInt(spec.paletteColors.bg.slice(1), 16),
    antialias: true,
    preserveDrawingBuffer: true,
    resolution: 1,
    autoDensity: false
  });
  document.body.appendChild(app.view);

  var palA = parseInt(spec.paletteColors.a.slice(1), 16);
  var palB = parseInt(spec.paletteColors.b.slice(1), 16);
  var palC = parseInt(spec.paletteColors.c.slice(1), 16);
  var root = new PIXIRef.Container();
  app.stage.addChild(root);

  var noise = PIXIRef.Texture.from(noiseCanvas(512, spec.seed, 6));
  var dispSprite = new PIXIRef.Sprite(noise);
  dispSprite.texture.baseTexture.wrapMode = PIXIRef.WRAP_MODES.REPEAT;
  dispSprite.scale.set(spec.width / 512, spec.height / 512);
  var disp = new PIXIRef.filters.DisplacementFilter(dispSprite);
  disp.scale.set(70, 70);
  app.stage.addChild(dispSprite);
  dispSprite.renderable = false;

  var filters = [disp];
  if (PIXIRef.filters.AdvancedBloomFilter) {
    filters.push(new PIXIRef.filters.AdvancedBloomFilter({ threshold: 0.42, bloomScale: 1.15, brightness: 1.05, blur: 6 }));
  } else {
    filters.push(new PIXIRef.filters.BlurFilter(1.2));
  }
  root.filters = filters;

  var rng = mulberry32(spec.seed);
  var template = spec.template;
  var sprites = [];
  if (template === 'glow-constellation' || template === 'hex-pulse') {
    var count = template === 'hex-pulse' ? 42 : 70;
    for (var i = 0; i < count; i++) {
      var g = new PIXIRef.Graphics();
      var color = i % 2 === 0 ? palA : palC;
      if (template === 'hex-pulse') {
        g.beginFill(color, 0.18);
        g.lineStyle(3, color, 0.9);
        g.drawPolygon([1, 0, 0.5, 0.86, -0.5, 0.86, -1, 0, -0.5, -0.86, 0.5, -0.86].map(function(v, idx) {
          return idx % 2 === 0 ? v * 48 : v * 48;
        }));
      } else {
        g.beginFill(color, 0.85);
        g.drawCircle(0, 0, 6 + (i % 5) * 3);
      }
      g.endFill();
      g.x = rng() * spec.width;
      g.y = rng() * spec.height;
      root.addChild(g);
      sprites.push(g);
    }
    for (var b = 0; b < 4; b++) {
      var aura = new PIXIRef.Graphics();
      aura.beginFill(b % 2 ? palA : palB, 0.12);
      aura.drawCircle(0, 0, 240 + b * 50);
      aura.endFill();
      aura.x = rng() * spec.width;
      aura.y = rng() * spec.height;
      root.addChildAt(aura, 0);
      sprites.push(aura);
    }
  } else if (template === 'ribbon-light') {
    for (var r = 0; r < 8; r++) {
      var gg = new PIXIRef.Graphics();
      root.addChild(gg);
      sprites.push(gg);
    }
  } else {
    for (var b = 0; b < 5; b++) {
      var blob = new PIXIRef.Graphics();
      blob.beginFill(b % 2 ? palA : palB, 0.55);
      blob.drawCircle(0, 0, 180 + b * 40);
      blob.endFill();
      blob.x = spec.width * (0.25 + (b % 3) * 0.25);
      blob.y = spec.height * (0.3 + (b % 2) * 0.3);
      root.addChild(blob);
      sprites.push(blob);
    }
  }

  app.ticker.add(function() {
    var u = window.StockRuntime.loopU();
    var ang = u * Math.PI * 2;
    disp.scale.set(60 + Math.sin(ang) * 28, 60 + Math.cos(ang) * 28);
    dispSprite.x = Math.sin(ang) * 80;
    dispSprite.y = Math.cos(ang) * 80;
    for (var s = 0; s < sprites.length; s++) {
      var node = sprites[s];
      if (template === 'ribbon-light' && node.clear) {
        node.clear();
        node.lineStyle(10, s % 2 ? palA : palC, 0.75);
        for (var x = 0; x <= spec.width; x += 18) {
          var yy = spec.height * 0.5 + Math.sin(x * 0.008 + ang + s) * (90 + s * 18);
          if (x === 0) node.moveTo(x, yy); else node.lineTo(x, yy);
        }
      } else {
        node.rotation = ang * (s % 2 === 0 ? 0.4 : -0.25);
        node.scale.set(0.85 + Math.sin(ang + s) * 0.15);
      }
    }
  });
}

function runP5(spec) {
  var P5 = window.p5;
  new P5(function(p) {
    var particles = [];
    p.setup = function() {
      p.createCanvas(spec.width, spec.height);
      p.pixelDensity(1);
      p.frameRate(spec.fps || 30);
      p.noiseSeed(spec.seed);
      p.randomSeed(spec.seed);
      var count = spec.width >= 2160 ? 2200 : 1600;
      if (spec.template === 'layered-fog') count = spec.width >= 2160 ? 90 : 70;
      for (var i = 0; i < count; i++) {
        particles.push({
          x: p.random(p.width),
          y: p.random(p.height),
          w: p.random(0.6, 2.4),
          hue: p.random(1)
        });
      }
      p.colorMode(p.RGB, 255, 255, 255, 1);
      p.background(spec.paletteColors.bg);
    };

    p.draw = function() {
      var u = window.StockRuntime.loopU();
      var loopX = Math.cos(u * Math.PI * 2);
      var loopY = Math.sin(u * Math.PI * 2);
      var bgc = p.color(spec.paletteColors.bg);
      if (spec.template === 'layered-fog') p.background(p.red(bgc), p.green(bgc), p.blue(bgc), 0.18);
      else p.background(bgc);
      var ca = p.color(spec.paletteColors.a);
      var cc = p.color(spec.paletteColors.c);

      if (spec.template === 'geometry-breath' || spec.template === 'crystal-grid') {
        p.noFill();
        var step = spec.template === 'crystal-grid' ? 90 : 140;
        for (var x = 0; x < p.width; x += step) {
          for (var y = 0; y < p.height; y += step) {
            var n = p.noise(x * 0.004, y * 0.004, loopX * 0.5 + 2);
            p.stroke(p.lerpColor(ca, cc, n));
            p.strokeWeight(1.5);
            p.push();
            p.translate(x, y);
            p.rotate(n * p.TWO_PI + u * p.TWO_PI);
            var s = step * (0.25 + n * 0.55);
            if (spec.template === 'crystal-grid') p.quad(0, -s, s, 0, 0, s, -s, 0);
            else p.rect(-s / 2, -s / 2, s, s, 8);
            p.pop();
          }
        }
        return;
      }

      p.noStroke();
      for (var i = 0; i < particles.length; i++) {
        var pt = particles[i];
        var ang = p.noise(pt.x * 0.0025, pt.y * 0.0025, loopX * 0.35 + 1) * p.TWO_PI * 2;
        if (spec.template === 'ribbon-swarm' || spec.template === 'organic-pulse') {
          p.stroke(p.lerpColor(ca, cc, pt.hue), 0.35);
          p.strokeWeight(pt.w);
          p.line(pt.x, pt.y, pt.x + Math.cos(ang) * 18, pt.y + Math.sin(ang) * 18);
          p.noStroke();
        } else {
          p.fill(p.lerpColor(ca, cc, pt.hue), 0.55);
          p.circle(pt.x, pt.y, pt.w * 3 * (spec.width / 1280));
        }
        pt.x += Math.cos(ang + loopY) * 1.2;
        pt.y += Math.sin(ang + loopX) * 1.2;
        if (pt.x < 0) pt.x = p.width;
        if (pt.x > p.width) pt.x = 0;
        if (pt.y < 0) pt.y = p.height;
        if (pt.y > p.height) pt.y = 0;
      }
    };
  }, document.body);
}

async function startStockRuntime(spec) {
  try {
    window.StockRuntime = {
      duration: spec.duration,
      resetClock: function() { clockOrigin = performance.now(); },
      loopU: function() {
        var d = Math.max(0.001, spec.duration || 10);
        return (((performance.now() - clockOrigin) / 1000) / d) % 1;
      }
    };
    clockOrigin = performance.now();
    if (spec.engine === 'pixijs') runPixi(spec);
    else if (spec.engine === 'p5js') runP5(spec);
    else await runThree(spec, window.__THREE__, window.__THREE_ADDONS__);
    window.parent.postMessage({ type: 'stock-ready' }, '*');
  } catch (err) {
    window.parent.postMessage({ type: 'error', message: String(err && err.message ? err.message : err) }, '*');
  }
}

window.startStockRuntime = startStockRuntime;
`;
