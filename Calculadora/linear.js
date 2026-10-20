/* ═══════════════════════════════════════
   SISTEMAS LINEARES — Eliminação de Gauss
═══════════════════════════════════════ */

function buildMatrix() {
  const n = parseInt(document.getElementById('linSize').value);
  const wrap = document.getElementById('matrixWrap');
  const vars = ['x', 'y', 'z', 'w'].slice(0, n);

  let html = '<div class="matrix-scroll"><table class="matrix-table">';
  for (let i = 0; i < n; i++) {
    html += '<tr>';
    for (let j = 0; j < n; j++) {
      html += `<td><input class="matrix-input" id="m${i}_${j}" type="number" step="any" placeholder="0"/></td>`;
      if (j < n - 1) html += `<td class="matrix-sep">${vars[j]}</td><td class="matrix-sep">+</td>`;
      else html += `<td class="matrix-sep">${vars[j]}</td><td class="matrix-eq">=</td>`;
    }
    html += `<td><input class="matrix-input" id="m${i}_${n}" type="number" step="any" placeholder="0"/></td>`;
    html += '</tr>';
  }
  html += '</table></div>';
  wrap.innerHTML = html;
  document.getElementById('linearResult').innerHTML = '';
}

function getMatrix() {
  const n = parseInt(document.getElementById('linSize').value);
  const A = [];
  for (let i = 0; i < n; i++) {
    A[i] = [];
    for (let j = 0; j <= n; j++) {
      const val = parseFloat(document.getElementById(`m${i}_${j}`)?.value) || 0;
      A[i][j] = val;
    }
  }
  return { A, n };
}

function gaussElim(A, n) {
  // Forward elimination with partial pivoting
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(A[row][col]) > Math.abs(A[maxRow][col])) maxRow = row;
    }
    [A[col], A[maxRow]] = [A[maxRow], A[col]];

    if (Math.abs(A[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = A[row][col] / A[col][col];
      for (let k = col; k <= n; k++) {
        A[row][k] -= factor * A[col][k];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    if (Math.abs(A[i][i]) < 1e-12) {
      // Check consistency
      if (Math.abs(A[i][n]) > 1e-8) return null; // inconsistent
      x[i] = 0; // free variable
      continue;
    }
    x[i] = A[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
    x[i] /= A[i][i];
  }
  return x;
}

function solveLinear() {
  const { A, n } = getMatrix();
  const vars = ['x', 'y', 'z', 'w'].slice(0, n);
  const result = document.getElementById('linearResult');

  const sol = gaussElim(A, n);

  if (!sol) {
    result.innerHTML = '<span class="err">Sistema inconsistente (sem solução).</span>';
    return;
  }

  const lines = sol.map((v, i) => {
    const fmt = parseFloat(v.toPrecision(10));
    return `<span class="ok">${vars[i]} = ${fmt}</span>`;
  });

  // Verify
  const { A: Aorig } = getMatrix();
  let valid = true;
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += Aorig[i][j] * sol[j];
    if (Math.abs(sum - Aorig[i][n]) > 1e-6) { valid = false; break; }
  }

  result.innerHTML = lines.join('\n') +
    (valid ? '\n<span style="opacity:.5;font-size:12px">✓ Verificado</span>'
           : '\n<span class="err">⚠ Verificação falhou</span>');
}

function clearLinear() {
  const n = parseInt(document.getElementById('linSize').value);
  for (let i = 0; i < n; i++)
    for (let j = 0; j <= n; j++) {
      const el = document.getElementById(`m${i}_${j}`);
      if (el) el.value = '';
    }
  document.getElementById('linearResult').innerHTML = '';
}

// Init on load
buildMatrix();
