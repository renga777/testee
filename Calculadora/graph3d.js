/* ═══════════════════════════════════════
   GRÁFICO 3D — Three.js
═══════════════════════════════════════ */

let scene3, camera3, renderer3, mesh3, axes3, animId3;
let isDragging = false, lastMouse = { x: 0, y: 0 };
let spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 4 };

function init3D() {
  const container = document.getElementById('canvas3dWrap');
  if (renderer3) return; // já iniciado

  scene3 = new THREE.Scene();
  scene3.background = new THREE.Color(getComputedStyle(document.documentElement)
    .getPropertyValue('--surface2').trim() || '#0d0d1a');

  const w = container.clientWidth  || 800;
  const h = container.clientHeight || 450;

  camera3 = new THREE.PerspectiveCamera(50, w / h, 0.01, 1000);
  updateCamera();

  renderer3 = new THREE.WebGLRenderer({ antialias: true });
  renderer3.setPixelRatio(window.devicePixelRatio);
  renderer3.setSize(w, h);
  container.appendChild(renderer3.domElement);

  // Luz
  const amb = new THREE.AmbientLight(0xffffff, 0.5);
  const dir = new THREE.DirectionalLight(0xffffff, 0.8);
  dir.position.set(2, 4, 3);
  scene3.add(amb, dir);

  buildAxes3D();
  animate3D();
  bindEvents3D();

  window.addEventListener('resize', resize3D);
}

function updateCamera() {
  const { theta, phi, radius } = spherical;
  camera3.position.set(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
  camera3.lookAt(0, 0, 0);
}

function animate3D() {
  animId3 = requestAnimationFrame(animate3D);
  renderer3.render(scene3, camera3);
}

function resize3D() {
  if (!renderer3) return;
  const container = document.getElementById('canvas3dWrap');
  if (!container || !document.getElementById('tab-3d').classList.contains('active')) return;
  const w = container.clientWidth;
  const h = container.clientHeight;
  camera3.aspect = w / h;
  camera3.updateProjectionMatrix();
  renderer3.setSize(w, h);
}

/* ── Eixos ── */
function buildAxes3D() {
  if (axes3) scene3.remove(axes3);
  axes3 = new THREE.Group();

  const mat = (color) => new THREE.LineBasicMaterial({ color });
  const line = (pts, color) => {
    const geo = new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p)));
    return new THREE.Line(geo, mat(color));
  };

  const L = 1.6;
  axes3.add(line([[-L,0,0],[L,0,0]], 0xff4444)); // X vermelho
  axes3.add(line([[0,-L,0],[0,L,0]], 0x44ff44)); // Y verde
  axes3.add(line([[0,0,-L],[0,0,L]], 0x4488ff)); // Z azul

  // Labels via sprite
  [['X', L+.1, 0, 0, 0xff4444],
   ['Y', 0, L+.1, 0, 0x44ff44],
   ['Z', 0, 0, L+.1, 0x4488ff]].forEach(([txt, x, y, z, col]) => {
    const sprite = makeTextSprite(txt, col);
    sprite.position.set(x, y, z);
    axes3.add(sprite);
  });

  scene3.add(axes3);
}

function makeTextSprite(text, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
  ctx.font = 'bold 40px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 32, 32);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.15, 0.15, 1);
  return sprite;
}

/* ── Plot ── */
function plot3D() {
  const fnStr  = document.getElementById('fn3d').value.trim();
  const xMin   = parseFloat(document.getElementById('x3dMin').value);
  const xMax   = parseFloat(document.getElementById('x3dMax').value);
  const yMin   = parseFloat(document.getElementById('y3dMin').value);
  const yMax   = parseFloat(document.getElementById('y3dMax').value);
  const segs   = parseInt(document.getElementById('segs3d').value) || 60;

  if (!fnStr) return;

  let fn3;
  try {
    fn3 = new Function('x','y', `"use strict";
      const {sin,cos,tan,sqrt,abs,log,exp,pow,PI,E,sign,floor,ceil,round,min,max,asin,acos,atan,cbrt,log2,log10} = Math;
      const ln=log;
      return (${fnStr.replace(/\^/g,'**')});`);
    fn3(0, 0); // teste
  } catch {
    document.getElementById('result3d').textContent = 'Função inválida.';
    return;
  }

  document.getElementById('result3d').textContent = '';

  // Remove mesh anterior
  if (mesh3) { scene3.remove(mesh3); mesh3.geometry.dispose(); mesh3.material.dispose(); mesh3 = null; }

  const geo = new THREE.BufferGeometry();
  const positions = [], colors = [], indices = [];
  const N = segs + 1;

  // Calcular Z para normalizar cor
  const zVals = [];
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = xMin + (i / segs) * (xMax - xMin);
      const y = yMin + (j / segs) * (yMax - yMin);
      let z = 0;
      try { z = fn3(x, y); } catch {}
      zVals.push(isFinite(z) ? z : 0);
    }
  }
  const zMin = Math.min(...zVals), zMax = Math.max(...zVals);
  const zRange = zMax - zMin || 1;

  // Escala para caber em [-1, 1]
  const scaleX = 2 / (xMax - xMin || 1);
  const scaleY = 2 / (yMax - yMin || 1);
  const scaleZ = 2 / zRange;

  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = xMin + (i / segs) * (xMax - xMin);
      const y = yMin + (j / segs) * (yMax - yMin);
      const z = zVals[i * N + j];

      positions.push(
        (x - (xMin + xMax) / 2) * scaleX,
        (z - (zMin + zMax) / 2) * scaleZ,
        (y - (yMin + yMax) / 2) * scaleY
      );

      // Gradiente: azul (baixo) → ciano → verde → amarelo → vermelho (alto)
      const t = (z - zMin) / zRange;
      const c = gradientColor(t);
      colors.push(c.r, c.g, c.b);
    }
  }

  for (let i = 0; i < segs; i++) {
    for (let j = 0; j < segs; j++) {
      const a = i * N + j, b = a + 1, c = a + N, d = c + 1;
      indices.push(a, b, d, a, d, c);
    }
  }

  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new THREE.MeshPhongMaterial({
    vertexColors: true,
    side: THREE.DoubleSide,
    shininess: 40,
    transparent: true,
    opacity: 0.92,
  });

  mesh3 = new THREE.Mesh(geo, mat);
  scene3.add(mesh3);

  // Wireframe opcional
  if (document.getElementById('wireframe3d').checked) {
    const wf = new THREE.WireframeGeometry(geo);
    const wfLine = new THREE.LineSegments(wf, new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.08, transparent: true }));
    mesh3.add(wfLine);
  }
}

function gradientColor(t) {
  // azul → ciano → verde → amarelo → vermelho
  const stops = [
    [0,    0.1, 0.8],
    [0,    0.8, 0.8],
    [0,    0.8, 0.1],
    [0.9,  0.8, 0],
    [0.9,  0.1, 0],
  ];
  const idx = Math.min(Math.floor(t * (stops.length - 1)), stops.length - 2);
  const f   = t * (stops.length - 1) - idx;
  const a   = stops[idx], b = stops[idx + 1];
  return { r: a[0]+(b[0]-a[0])*f, g: a[1]+(b[1]-a[1])*f, b: a[2]+(b[2]-a[2])*f };
}

/* ── Controles de câmera ── */
function bindEvents3D() {
  const el = renderer3.domElement;

  // Mouse
  el.addEventListener('mousedown', e => { isDragging = true; lastMouse = { x: e.clientX, y: e.clientY }; });
  window.addEventListener('mouseup', () => { isDragging = false; });
  window.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x, dy = e.clientY - lastMouse.y;
    spherical.theta -= dx * 0.01;
    spherical.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.01));
    lastMouse = { x: e.clientX, y: e.clientY };
    updateCamera();
  });

  // Touch
  let lastTouch = null;
  el.addEventListener('touchstart', e => { if (e.touches.length === 1) lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && lastTouch) {
      const dx = e.touches[0].clientX - lastTouch.x, dy = e.touches[0].clientY - lastTouch.y;
      spherical.theta -= dx * 0.012;
      spherical.phi    = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi + dy * 0.012));
      lastTouch = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      updateCamera();
    }
  }, { passive: true });

  // Zoom scroll
  el.addEventListener('wheel', e => {
    e.preventDefault();
    spherical.radius = Math.max(1, Math.min(12, spherical.radius + e.deltaY * 0.005));
    updateCamera();
  }, { passive: false });

  // Zoom pinch
  let lastDist = 0;
  el.addEventListener('touchstart', e => { if (e.touches.length === 2) lastDist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
  el.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      spherical.radius = Math.max(1, Math.min(12, spherical.radius - (d - lastDist) * 0.02));
      lastDist = d;
      updateCamera();
    }
  }, { passive: true });
}

/* ── Reset câmera ── */
function resetCamera3D() {
  spherical = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 4 };
  updateCamera();
}

/* ── Export PNG ── */
function export3DPNG() {
  if (!renderer3) return;
  renderer3.render(scene3, camera3);
  const a = document.createElement('a');
  a.download = 'grafico3d.png';
  a.href = renderer3.domElement.toDataURL('image/png');
  a.click();
}

/* ── Atualiza cor de fundo com o tema ── */
function update3DBg() {
  if (!scene3) return;
  const style = getComputedStyle(document.documentElement);
  const bg = style.getPropertyValue('--surface2').trim();
  scene3.background = new THREE.Color(bg || '#0d0d1a');
}
