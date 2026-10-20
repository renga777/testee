/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
let expr = '';
let isDeg = true;
let memory = 0;
let justCalculated = false;
let history = JSON.parse(localStorage.getItem('calcHistory') || '[]');

const $result = document.getElementById('result');
const $expr   = document.getElementById('expression');

/* ═══════════════════════════════════════
   MATH HELPERS
═══════════════════════════════════════ */
function fact(n) {
  n = Math.round(n);
  if (n < 0 || n > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

function prepareExpr(e) {
  if (!isDeg) return e;
  return e
    .replace(/Math\.sin\(/g,  'Math.sin(Math.PI/180*(')
    .replace(/Math\.cos\(/g,  'Math.cos(Math.PI/180*(')
    .replace(/Math\.tan\(/g,  'Math.tan(Math.PI/180*(')
    .replace(/Math\.asin\(/g, '(180/Math.PI*Math.asin(')
    .replace(/Math\.acos\(/g, '(180/Math.PI*Math.acos(')
    .replace(/Math\.atan\(/g, '(180/Math.PI*Math.atan(');
}

function autoClose(e) {
  const d = (e.match(/\(/g)||[]).length - (e.match(/\)/g)||[]).length;
  return e + ')'.repeat(Math.max(0, d));
}

function evalExpr(e) {
  const prepared = autoClose(prepareExpr(e));
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return(' + prepared + ')')();
}

/* ═══════════════════════════════════════
   DISPLAY
═══════════════════════════════════════ */
function updateDisplay() {
  $result.textContent = expr || '0';
  $result.classList.remove('error');
}

/* ═══════════════════════════════════════
   INPUT
═══════════════════════════════════════ */
function inp(val) {
  if (justCalculated && /^[\d(]|Math\.(PI|E)$/.test(val)) expr = '';
  justCalculated = false;
  expr += val;
  updateDisplay();
}

function inpPow(n) {
  justCalculated = false;
  const m = expr.match(/([\d.]+|\))$/);
  if (m) {
    const base = m[0];
    expr = expr.slice(0, -base.length) + 'Math.pow(' + base + ',' + n + ')';
  } else {
    expr += 'Math.pow(';
  }
  updateDisplay();
}

function inputDot() {
  justCalculated = false;
  const parts = expr.split(/[+\-*/(%]/);
  if (!(parts[parts.length - 1] || '').includes('.')) expr += '.';
  updateDisplay();
}

function backspace() {
  justCalculated = false;
  expr = expr.slice(0, -1);
  updateDisplay();
}

function clearAll() {
  expr = '';
  justCalculated = false;
  $expr.textContent = '';
  $result.textContent = '0';
  $result.classList.remove('error');
}

function toggleSign() {
  if (!expr) return;
  expr = expr.startsWith('-') ? expr.slice(1) : '-' + expr;
  updateDisplay();
}

function toggleMode() {
  isDeg = !isDeg;
  document.querySelector('[onclick="toggleMode()"]').textContent = isDeg ? 'DEG' : 'RAD';
}

/* ═══════════════════════════════════════
   CALCULATE
═══════════════════════════════════════ */
function calculate() {
  if (!expr) return;
  try {
    const raw = evalExpr(expr);
    if (!isFinite(raw)) throw new Error();
    const formatted = parseFloat(raw.toPrecision(12)).toString();
    addHistory(expr, formatted);
    $expr.textContent = expr + ' =';
    $result.textContent = formatted;
    $result.classList.remove('error');
    expr = formatted;
    justCalculated = true;
  } catch {
    $result.textContent = 'Erro';
    $result.classList.add('error');
    expr = '';
    justCalculated = false;
  }
}

/* ═══════════════════════════════════════
   MEMORY
═══════════════════════════════════════ */
function memStore()  { memory = parseFloat($result.textContent) || 0; }
function memRecall() { justCalculated = false; expr += memory.toString(); updateDisplay(); }
function memClear()  { memory = 0; }

/* ═══════════════════════════════════════
   HISTORY
═══════════════════════════════════════ */
function addHistory(expression, result) {
  const entry = { expression, result, time: new Date().toLocaleTimeString('pt-BR') };
  history.unshift(entry);
  if (history.length > 100) history.pop();
  localStorage.setItem('calcHistory', JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  const list  = document.getElementById('historyList');
  const empty = document.getElementById('historyEmpty');
  list.innerHTML = '';
  empty.style.display = history.length ? 'none' : 'block';
  history.forEach((h, i) => {
    const li = document.createElement('li');
    li.title = 'Clique para reusar';
    li.innerHTML = `
      <div>
        <div class="hist-expr">${escHtml(h.expression)}</div>
        <div class="hist-result">= ${escHtml(h.result)}</div>
      </div>
      <div class="hist-time">${h.time}</div>`;
    li.onclick = () => { expr = h.result; justCalculated = true; updateDisplay(); switchTab('calc'); };
    list.appendChild(li);
  });
}

function clearHistory() {
  history = [];
  localStorage.removeItem('calcHistory');
  renderHistory();
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ═══════════════════════════════════════
   LaTeX EXPORT
═══════════════════════════════════════ */
function exprToLatex(e) {
  return e
    .replace(/Math\.PI/g, '\\pi')
    .replace(/Math\.E(?!\w)/g, 'e')
    .replace(/Math\.sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
    .replace(/Math\.cbrt\(([^)]+)\)/g, '\\sqrt[3]{$1}')
    .replace(/Math\.pow\(([^,]+),([^)]+)\)/g, '{$1}^{$2}')
    .replace(/Math\.sin\(/g, '\\sin(')
    .replace(/Math\.cos\(/g, '\\cos(')
    .replace(/Math\.tan\(/g, '\\tan(')
    .replace(/Math\.asin\(/g, '\\arcsin(')
    .replace(/Math\.acos\(/g, '\\arccos(')
    .replace(/Math\.atan\(/g, '\\arctan(')
    .replace(/Math\.log10\(/g, '\\log(')
    .replace(/Math\.log2\(/g, '\\log_2(')
    .replace(/Math\.log\(/g, '\\ln(')
    .replace(/Math\.abs\(/g, '|')
    .replace(/fact\(/g, '')
    .replace(/\*/g, '\\cdot ')
    .replace(/\//g, '\\div ');
}

function exportLatex() {
  const latex = '$$' + exprToLatex(expr || $result.textContent) + '$$';
  document.getElementById('latexOutput').value = latex;
  openModal('latexModal');
}

function copyLatex() {
  const ta = document.getElementById('latexOutput');
  navigator.clipboard.writeText(ta.value).catch(() => { ta.select(); document.execCommand('copy'); });
}

function exportHistoryLatex() {
  if (!history.length) return;
  const lines = history.map(h => `${exprToLatex(h.expression)} = ${h.result}`).join('\\\\\n');
  document.getElementById('latexOutput').value = '\\begin{align*}\n' + lines + '\n\\end{align*}';
  openModal('latexModal');
}

/* ═══════════════════════════════════════
   PDF EXPORT
═══════════════════════════════════════ */
function buildPrintHTML(title, body) {
  const theme = document.documentElement.getAttribute('data-theme');
  const isDark = theme !== 'light';
  const bg  = isDark ? '#1a1a2e' : '#fff';
  const clr = isDark ? '#e8eaf6' : '#1a1a2e';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
    <title>${title}</title>
    <style>
      body{font-family:'Segoe UI',sans-serif;background:${bg};color:${clr};padding:32px;font-size:14px;}
      h2{margin-bottom:16px;} table{border-collapse:collapse;width:100%;}
      td,th{padding:8px 12px;border:1px solid rgba(128,128,128,.3);text-align:left;}
      th{background:rgba(108,99,255,.2);}
    </style></head><body>${body}</body></html>`;
}

function exportPDF() {
  const exprVal = $expr.textContent || expr;
  const resVal  = $result.textContent;
  const latex   = exprToLatex(expr || resVal);
  const body = `<h2>Calculadora Científica — Resultado</h2>
    <table><tr><th>Expressão</th><th>Resultado</th><th>LaTeX</th></tr>
    <tr><td>${escHtml(exprVal)}</td><td><strong>${escHtml(resVal)}</strong></td><td><code>${escHtml(latex)}</code></td></tr>
    </table><p style="margin-top:16px;opacity:.5;font-size:12px">Gerado em ${new Date().toLocaleString('pt-BR')}</p>`;
  printWindow(buildPrintHTML('Resultado', body));
}

function exportHistoryPDF() {
  if (!history.length) return;
  const rows = history.map(h =>
    `<tr><td>${escHtml(h.expression)}</td><td><strong>${escHtml(h.result)}</strong></td><td>${h.time}</td></tr>`
  ).join('');
  const body = `<h2>Histórico de Cálculos</h2>
    <table><tr><th>Expressão</th><th>Resultado</th><th>Hora</th></tr>${rows}</table>
    <p style="margin-top:16px;opacity:.5;font-size:12px">Gerado em ${new Date().toLocaleString('pt-BR')}</p>`;
  printWindow(buildPrintHTML('Histórico', body));
}

function printWindow(html) {
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); }, 400);
}

/* ═══════════════════════════════════════
   SEND TO GRAPH
═══════════════════════════════════════ */
function sendToGraph() {
  const e = expr || $result.textContent;
  if (!e) return;
  const jsExpr = e.replace(/Math\.\w+/g, m => m);
  document.getElementById('fn0').value = jsExpr.replace(/Math\./g, 'Math.');
  switchTab('graph');
}

/* ═══════════════════════════════════════
   TABS
═══════════════════════════════════════ */
const TAB_ORDER = ['calc','graph','3d','linear','matrix','comb','stats','history'];

function switchTab(id) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  const idx = TAB_ORDER.indexOf(id);
  document.querySelectorAll('.tab')[idx]?.classList.add('active');
  if (id === 'history') renderHistory();
  if (id === 'graph')   resizeCanvas();
  if (id === 'linear')  buildMatrix();
  if (id === 'matrix')  buildMatrixModule();
  if (id === '3d')      { init3D(); resize3D(); }
}

/* ═══════════════════════════════════════
   MODALS
═══════════════════════════════════════ */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

/* ═══════════════════════════════════════
   THEMES
═══════════════════════════════════════ */
function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('calcTheme', t);
}

(function initTheme() {
  const saved = localStorage.getItem('calcTheme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  document.getElementById('themeSelect').value = saved;
})();

/* ═══════════════════════════════════════
   KEYBOARD SHORTCUTS
═══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const k = e.key;
  if (k >= '0' && k <= '9')       { inp(k); return; }
  if (k === '+')                   { inp('+'); return; }
  if (k === '-')                   { inp('-'); return; }
  if (k === '*')                   { inp('*'); return; }
  if (k === '/')                   { e.preventDefault(); inp('/'); return; }
  if (k === '.')                   { inputDot(); return; }
  if (k === 'Enter' || k === '=')  { calculate(); return; }
  if (k === 'Backspace')           { backspace(); return; }
  if (k === 'Escape')              { clearAll(); return; }
  if (k === '(' || k === ')')      { inp(k); return; }
  if (k === '%')                   { inp('%'); return; }
  if (k === 'F1')                  { e.preventDefault(); openModal('shortcutsModal'); return; }

  if (e.ctrlKey || e.metaKey) return;
  switch (k.toLowerCase()) {
    case 's': inp('Math.sin('); break;
    case 'c': inp('Math.cos('); break;
    case 't': inp('Math.tan('); break;
    case 'l': inp('Math.log10('); break;
    case 'n': inp('Math.log('); break;
    case 'r': inp('Math.sqrt('); break;
    case 'p': inp('Math.PI'); break;
    case 'e': inp('Math.E'); break;
    case 'h': switchTab('history'); break;
    case 'g': switchTab('graph'); break;
    case '3': switchTab('3d'); break;
    case 'b': switchTab('stats'); break;
  }
});

/* ═══════════════════════════════════════
   PWA — SERVICE WORKER
═══════════════════════════════════════ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

let deferredPrompt;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  document.getElementById('installBtn').style.display = 'inline-block';
});
document.getElementById('installBtn').addEventListener('click', () => {
  deferredPrompt?.prompt();
  deferredPrompt = null;
  document.getElementById('installBtn').style.display = 'none';
});

/* ═══════════════════════════════════════
   INIT
═══════════════════════════════════════ */
renderHistory();
