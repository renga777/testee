/* ═══════════════════════════════════════
   GRAPH ENGINE
═══════════════════════════════════════ */
const canvas  = document.getElementById('graphCanvas');
const ctx     = canvas.getContext('2d');
const tooltip = document.getElementById('graphTooltip');

let fnRows = 1;
let plotState = null;

function resizeCanvas() {
  const wrap = canvas.parentElement;
  canvas.width  = wrap.clientWidth  || 800;
  canvas.height = Math.round(canvas.width * (9/16));
  if (plotState) drawPlot(plotState);
}

window.addEventListener('resize', () => {
  if (document.getElementById('tab-graph').classList.contains('active')) resizeCanvas();
});

/* ── Add function row ── */
function addFnRow() {
  const colors = ['#6c63ff','#ff6b6b','#4ade80','#fbbf24','#38bdf8','#f472b6'];
  const container = document.getElementById('fnRows');
  const div = document.createElement('div');
  div.className = 'fn-entry';
  div.id = 'fnEntry' + fnRows;
  div.innerHTML = `
    <span class="fn-label">f${fnRows+1}(x) =</span>
    <input class="fn-input" id="fn${fnRows}" type="text" placeholder="cos(x)"/>
    <input type="color" class="fn-color" id="fc${fnRows}" value="${colors[fnRows % colors.length]}"/>
    <button class="icon-btn" onclick="removeFnRow(${fnRows})">✕</button>`;
  container.appendChild(div);
  fnRows++;
}

function removeFnRow(i) {
  document.getElementById('fnEntry' + i)?.remove();
}

/* ── Build safe evaluator ── */
function makeFn(raw) {
  const e = raw
    .replace(/\^/g, '**')
    .replace(/(\d)(Math\.|x)/g, '$1*$2')
    .replace(/\)([\dx(])/g, ')*$1');
  // eslint-disable-next-line no-new-func
  return Function('x', `"use strict";
    const {sin,cos,tan,asin,acos,atan,sqrt,cbrt,abs,log,log2,log10,exp,pow,PI,E,sign,floor,ceil,round,min,max} = Math;
    const ln = log;
    return (${e});`);
}

/* ── Plot ── */
function plotGraph() {
  const xMin = parseFloat(document.getElementById('xMin').value);
  const xMax = parseFloat(document.getElementById('xMax').value);
  const yMin = parseFloat(document.getElementById('yMin').value);
  const yMax = parseFloat(document.getElementById('yMax').value);

  const fns = [];
  for (let i = 0; i < fnRows; i++) {
    const inp = document.getElementById('fn' + i);
    const col = document.getElementById('fc' + i);
    if (!inp || !inp.value.trim()) continue;
    try { fns.push({ fn: makeFn(inp.value), color: col?.value || '#6c63ff', label: inp.value }); }
    catch { /* skip invalid */ }
  }

  plotState = { xMin, xMax, yMin, yMax, fns };
  resizeCanvas();
}

function drawPlot({ xMin, xMax, yMin, yMax, fns }) {
  const W = canvas.width, H = canvas.height;
  const theme = document.documentElement.getAttribute('data-theme');
  const isDark = theme !== 'light';

  const bgColor   = isDark ? '#0d0d1a' : '#f8f9fc';
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const axisColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)';
  const labelClr  = isDark ? '#6b7db3' : '#5a6a8a';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, W, H);

  const toX = x => ((x - xMin) / (xMax - xMin)) * W;
  const toY = y => H - ((y - yMin) / (yMax - yMin)) * H;

  /* grid */
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  const xStep = niceStep(xMax - xMin, 10);
  const yStep = niceStep(yMax - yMin, 8);

  ctx.fillStyle = labelClr;
  ctx.font = '11px Segoe UI, sans-serif';
  ctx.textAlign = 'center';

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    const px = toX(x);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    if (Math.abs(x) > xStep * 0.1) ctx.fillText(fmt(x), px, H - 4);
  }
  ctx.textAlign = 'right';
  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    const py = toY(y);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    if (Math.abs(y) > yStep * 0.1) ctx.fillText(fmt(y), 36, py + 4);
  }

  /* axes */
  ctx.strokeStyle = axisColor;
  ctx.lineWidth = 1.5;
  const ox = toX(0), oy = toY(0);
  if (ox >= 0 && ox <= W) { ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, H); ctx.stroke(); }
  if (oy >= 0 && oy <= H) { ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(W, oy); ctx.stroke(); }

  /* functions */
  const steps = W * 2;
  fns.forEach(({ fn, color, label }) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      let y;
      try { y = fn(x); } catch { started = false; continue; }
      if (!isFinite(y) || isNaN(y)) { started = false; continue; }
      const px = (i / steps) * W;
      const py = toY(y);
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    /* legend */
    const li = fns.indexOf({ fn, color, label });
  });

  /* legend */
  let ly = 16;
  fns.forEach(({ color, label }) => {
    ctx.fillStyle = color;
    ctx.fillRect(W - 140, ly - 10, 18, 3);
    ctx.fillStyle = labelClr;
    ctx.textAlign = 'left';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText(label.length > 18 ? label.slice(0,18)+'…' : label, W - 118, ly);
    ly += 18;
  });
}

function niceStep(range, target) {
  const raw = range / target;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  return (norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10) * mag;
}

function fmt(n) {
  if (Number.isInteger(n)) return n.toString();
  return parseFloat(n.toPrecision(3)).toString();
}

/* ── Tooltip on hover ── */
canvas.addEventListener('mousemove', e => {
  if (!plotState) return;
  const rect = canvas.getBoundingClientRect();
  const px = (e.clientX - rect.left) * (canvas.width / rect.width);
  const { xMin, xMax, fns } = plotState;
  const x = xMin + (px / canvas.width) * (xMax - xMin);
  const lines = fns.map(({ fn, label }) => {
    try { const y = fn(x); return isFinite(y) ? `${label} = ${parseFloat(y.toPrecision(5))}` : null; }
    catch { return null; }
  }).filter(Boolean);
  if (!lines.length) { tooltip.style.display = 'none'; return; }
  tooltip.style.display = 'block';
  tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
  tooltip.style.top  = (e.clientY - rect.top  - 10) + 'px';
  tooltip.innerHTML  = `x = ${parseFloat(x.toPrecision(4))}<br>${lines.join('<br>')}`;
});
canvas.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });

/* ── Zoom with scroll ── */
canvas.addEventListener('wheel', e => {
  if (!plotState) return;
  e.preventDefault();
  const factor = e.deltaY > 0 ? 1.15 : 0.87;
  const { xMin, xMax, yMin, yMax } = plotState;
  const cx = (xMin + xMax) / 2, cy = (yMin + yMax) / 2;
  const hw = (xMax - xMin) / 2 * factor, hh = (yMax - yMin) / 2 * factor;
  plotState = { ...plotState, xMin: cx-hw, xMax: cx+hw, yMin: cy-hh, yMax: cy+hh };
  document.getElementById('xMin').value = parseFloat((cx-hw).toFixed(2));
  document.getElementById('xMax').value = parseFloat((cx+hw).toFixed(2));
  document.getElementById('yMin').value = parseFloat((cy-hh).toFixed(2));
  document.getElementById('yMax').value = parseFloat((cy+hh).toFixed(2));
  drawPlot(plotState);
}, { passive: false });

/* ── Export PNG ── */
function exportGraphPNG() {
  if (!plotState) { plotGraph(); }
  const a = document.createElement('a');
  a.download = 'grafico.png';
  a.href = canvas.toDataURL('image/png');
  a.click();
}

function clearGraph() {
  plotState = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
