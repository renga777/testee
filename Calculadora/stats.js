/* ═══════════════════════════════════════
   ESTATÍSTICA BÁSICA
═══════════════════════════════════════ */

function parseData() {
  const raw = document.getElementById('statsInput').value;
  const nums = raw.split(/[\s,;]+/).map(Number).filter(v => !isNaN(v) && v !== '');
  return nums;
}

function statsMean(d) { return d.reduce((a, b) => a + b, 0) / d.length; }

function statsMedian(d) {
  const s = [...d].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function statsMode(d) {
  const freq = {};
  d.forEach(v => freq[v] = (freq[v] || 0) + 1);
  const max = Math.max(...Object.values(freq));
  if (max === 1) return 'Amodal';
  return Object.keys(freq).filter(k => freq[k] === max).join(', ');
}

function statsVariance(d, pop) {
  const mean = statsMean(d);
  const n = pop ? d.length : d.length - 1;
  return d.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
}

function statsQuartiles(d) {
  const s = [...d].sort((a, b) => a - b);
  const n = s.length;
  const q2 = statsMedian(s);
  const lower = s.slice(0, Math.floor(n / 2));
  const upper = n % 2 ? s.slice(Math.ceil(n / 2)) : s.slice(n / 2);
  return { q1: statsMedian(lower), q2, q3: statsMedian(upper) };
}

function fmt(v) {
  if (typeof v !== 'number') return v;
  return parseFloat(v.toPrecision(10)).toString();
}

function calcStats() {
  const d = parseData();
  const out = document.getElementById('statsResult');

  if (d.length < 2) {
    out.innerHTML = '<span class="err">Insira ao menos 2 números separados por vírgula ou espaço.</span>';
    return;
  }

  const sorted = [...d].sort((a, b) => a - b);
  const mean   = statsMean(d);
  const median = statsMedian(d);
  const mode   = statsMode(d);
  const varPop = statsVariance(d, true);
  const varAmo = statsVariance(d, false);
  const stdPop = Math.sqrt(varPop);
  const stdAmo = Math.sqrt(varAmo);
  const min    = sorted[0];
  const max    = sorted[sorted.length - 1];
  const range  = max - min;
  const { q1, q2, q3 } = statsQuartiles(d);
  const iqr    = q3 - q1;

  const rows = [
    ['n (tamanho)',              d.length],
    ['Média (x̄)',                fmt(mean)],
    ['Mediana',                  fmt(median)],
    ['Moda',                     mode],
    ['Mínimo',                   fmt(min)],
    ['Máximo',                   fmt(max)],
    ['Amplitude',                fmt(range)],
    ['Q1 (1º quartil)',          fmt(q1)],
    ['Q2 (2º quartil / mediana)',fmt(q2)],
    ['Q3 (3º quartil)',          fmt(q3)],
    ['IQR (Q3 − Q1)',            fmt(iqr)],
    ['Variância populacional',   fmt(varPop)],
    ['Variância amostral',       fmt(varAmo)],
    ['Desvio padrão pop. (σ)',   fmt(stdPop)],
    ['Desvio padrão amostral (s)',fmt(stdAmo)],
  ];

  out.innerHTML = `<table class="stats-table">
    ${rows.map(([label, val]) =>
      `<tr><td class="stats-label">${label}</td><td class="stats-value">${val}</td></tr>`
    ).join('')}
  </table>`;
}

function clearStats() {
  document.getElementById('statsInput').value = '';
  document.getElementById('statsResult').innerHTML = '';
}
