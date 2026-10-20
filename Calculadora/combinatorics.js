/* ═══════════════════════════════════════
   ANÁLISE COMBINATÓRIA
═══════════════════════════════════════ */

function bigFact(n) {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1n;
  let r = 1n;
  for (let i = 2n; i <= BigInt(n); i++) r *= i;
  return r;
}

function fmtBig(n) {
  const s = n.toString();
  return s.length > 20 ? s.slice(0, 6) + '…(' + s.length + ' dígitos)' : s;
}

function combCalc() {
  const n = parseInt(document.getElementById('combN').value);
  const k = parseInt(document.getElementById('combK').value);
  const res = document.getElementById('combResult');

  if (isNaN(n) || isNaN(k) || n < 0 || k < 0) { res.innerHTML = '<span class="base-err">Valores inválidos.</span>'; return; }

  const fn = bigFact(n), fk = bigFact(k), fnk = bigFact(n - k < 0 ? -1 : n - k);

  const P  = n >= 0 ? fmtBig(fn) : '—';
  const Pk = (k <= n) ? fmtBig(fn / fnk) : '—';
  const C  = (k <= n) ? fmtBig(fn / (fk * fnk)) : '—';
  const Pr = (k <= n) ? fmtBig(fn / fnk) : '—'; // arranjo = P(n,k)

  res.innerHTML = `
    <div class="comb-grid">
      <div class="comb-card">
        <div class="comb-name">Permutação simples</div>
        <div class="comb-formula">P(${n}) = ${n}!</div>
        <div class="comb-value">${P}</div>
      </div>
      <div class="comb-card">
        <div class="comb-name">Arranjo</div>
        <div class="comb-formula">A(${n},${k}) = ${n}! / (${n}-${k})!</div>
        <div class="comb-value">${Pk}</div>
      </div>
      <div class="comb-card">
        <div class="comb-name">Combinação</div>
        <div class="comb-formula">C(${n},${k}) = ${n}! / (${k}! · (${n}-${k})!)</div>
        <div class="comb-value">${C}</div>
      </div>
      <div class="comb-card">
        <div class="comb-name">Permutação com rep.</div>
        <div class="comb-formula">PR = n! / (n₁! · n₂! · …)</div>
        <div class="comb-value" style="font-size:12px;opacity:.6">Use campo abaixo</div>
      </div>
    </div>`;

  buildPascal(Math.min(n, 12));
  buildBinomio(n, k);
}

function buildPascal(n) {
  const wrap = document.getElementById('pascalWrap');
  if (n < 0) { wrap.innerHTML = ''; return; }
  let rows = [];
  for (let i = 0; i <= n; i++) {
    rows[i] = [];
    for (let j = 0; j <= i; j++) {
      rows[i][j] = Number(bigFact(i) / (bigFact(j) * bigFact(i - j)));
    }
  }
  wrap.innerHTML = '<p class="mat-op-label">Triângulo de Pascal</p>' +
    rows.map((row, i) =>
      `<div class="pascal-row">${row.map(v =>
        `<span class="pascal-cell">${v}</span>`
      ).join('')}</div>`
    ).join('');
}

function buildBinomio(n, k) {
  const wrap = document.getElementById('binomioWrap');
  if (n < 0 || n > 20) { wrap.innerHTML = ''; return; }

  const terms = [];
  for (let i = 0; i <= n; i++) {
    const c = Number(bigFact(n) / (bigFact(i) * bigFact(n - i)));
    const expA = n - i, expB = i;
    let term = '';
    if (c !== 1 || (expA === 0 && expB === 0)) term += c;
    if (expA > 0) term += (term ? '·' : '') + 'a' + (expA > 1 ? `<sup>${expA}</sup>` : '');
    if (expB > 0) term += (term ? '·' : '') + 'b' + (expB > 1 ? `<sup>${expB}</sup>` : '');
    terms.push(term || '1');
  }
  wrap.innerHTML = `<p class="mat-op-label">(a+b)<sup>${n}</sup> =</p>
    <div class="binomio-expr">${terms.join(' + ')}</div>`;
}

function calcPermRep() {
  const total = parseInt(document.getElementById('permRepTotal').value);
  const groups = document.getElementById('permRepGroups').value
    .split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n > 0);

  const res = document.getElementById('permRepResult');
  if (isNaN(total) || total < 1) { res.textContent = 'Informe o total.'; return; }

  const sumG = groups.reduce((a, b) => a + b, 0);
  if (sumG !== total) { res.textContent = `Soma dos grupos (${sumG}) ≠ total (${total}).`; return; }

  const num = bigFact(total);
  const den = groups.reduce((acc, g) => acc * bigFact(g), 1n);
  res.innerHTML = `<span class="ok">PR = ${fmtBig(num / den)}</span>`;
}
