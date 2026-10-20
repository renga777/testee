/* ═══════════════════════════════════════
   MÓDULO DE MATRIZES
═══════════════════════════════════════ */

let matRows = 3, matCols = 3;
let matRows2 = 3, matCols2 = 3;

function buildMatrixModule() {
  buildMatA();
  buildMatB();
}

function buildMatA() {
  matRows = parseInt(document.getElementById('matRowsA').value);
  matCols = parseInt(document.getElementById('matColsA').value);
  renderMatGrid('matGridA', matRows, matCols, 'a');
  syncMatB();
}

function buildMatB() {
  matRows2 = parseInt(document.getElementById('matRowsB').value);
  matCols2 = parseInt(document.getElementById('matColsB').value);
  renderMatGrid('matGridB', matRows2, matCols2, 'b');
}

function syncMatB() {
  // Para multiplicação A×B: colunas de B = linhas de A
  document.getElementById('matRowsB').value = matCols;
  matRows2 = matCols;
  buildMatB();
}

function renderMatGrid(id, rows, cols, prefix) {
  const wrap = document.getElementById(id);
  let html = '<div class="matrix-scroll"><table class="matrix-table">';
  for (let i = 0; i < rows; i++) {
    html += '<tr>';
    for (let j = 0; j < cols; j++) {
      html += `<td><input class="matrix-input" id="${prefix}${i}_${j}" type="number" step="any" placeholder="0"/></td>`;
    }
    html += '</tr>';
  }
  html += '</table></div>';
  wrap.innerHTML = html;
}

function getMatData(prefix, rows, cols) {
  const M = [];
  for (let i = 0; i < rows; i++) {
    M[i] = [];
    for (let j = 0; j < cols; j++) {
      M[i][j] = parseFloat(document.getElementById(`${prefix}${i}_${j}`)?.value) || 0;
    }
  }
  return M;
}

function fmtNum(n) {
  const r = parseFloat(n.toPrecision(10));
  return Number.isInteger(r) ? r.toString() : r.toString();
}

function matToHTML(M) {
  let html = '<div class="matrix-scroll"><table class="mat-result-table">';
  M.forEach(row => {
    html += '<tr>' + row.map(v => `<td>${fmtNum(v)}</td>`).join('') + '</tr>';
  });
  return html + '</table></div>';
}

function showMatResult(html) {
  document.getElementById('matResult').innerHTML = html;
}

function showMatError(msg) {
  document.getElementById('matResult').innerHTML = `<span class="base-err">${msg}</span>`;
}

/* ── Operações ── */

function matAdd() {
  const A = getMatData('a', matRows, matCols);
  const B = getMatData('b', matRows2, matCols2);
  if (matRows !== matRows2 || matCols !== matCols2) { showMatError('Dimensões incompatíveis para soma.'); return; }
  const R = A.map((row, i) => row.map((v, j) => v + B[i][j]));
  showMatResult('<p class="mat-op-label">A + B =</p>' + matToHTML(R));
}

function matSub() {
  const A = getMatData('a', matRows, matCols);
  const B = getMatData('b', matRows2, matCols2);
  if (matRows !== matRows2 || matCols !== matCols2) { showMatError('Dimensões incompatíveis para subtração.'); return; }
  const R = A.map((row, i) => row.map((v, j) => v - B[i][j]));
  showMatResult('<p class="mat-op-label">A − B =</p>' + matToHTML(R));
}

function matScalar() {
  const k = parseFloat(document.getElementById('matScalarVal').value);
  if (isNaN(k)) { showMatError('Informe um escalar válido.'); return; }
  const A = getMatData('a', matRows, matCols);
  const R = A.map(row => row.map(v => v * k));
  showMatResult(`<p class="mat-op-label">${k} × A =</p>` + matToHTML(R));
}

function matMul() {
  const A = getMatData('a', matRows, matCols);
  const B = getMatData('b', matRows2, matCols2);
  if (matCols !== matRows2) { showMatError(`Colunas de A (${matCols}) ≠ Linhas de B (${matRows2}).`); return; }
  const R = Array.from({ length: matRows }, (_, i) =>
    Array.from({ length: matCols2 }, (_, j) =>
      A[i].reduce((s, _, k) => s + A[i][k] * B[k][j], 0)
    )
  );
  showMatResult('<p class="mat-op-label">A × B =</p>' + matToHTML(R));
}

function matTranspose() {
  const A = getMatData('a', matRows, matCols);
  const R = Array.from({ length: matCols }, (_, j) =>
    Array.from({ length: matRows }, (_, i) => A[i][j])
  );
  showMatResult('<p class="mat-op-label">Aᵀ =</p>' + matToHTML(R));
}

function matDet() {
  if (matRows !== matCols) { showMatError('Determinante só existe para matrizes quadradas.'); return; }
  const A = getMatData('a', matRows, matCols);
  const d = det(A, matRows);
  showMatResult(`<p class="mat-op-label">det(A) =</p><p class="mat-scalar">${fmtNum(d)}</p>`);
}

function matInverse() {
  if (matRows !== matCols) { showMatError('Inversa só existe para matrizes quadradas.'); return; }
  const A = getMatData('a', matRows, matCols);
  const d = det(A, matRows);
  if (Math.abs(d) < 1e-12) { showMatError('Matriz singular (det = 0), não tem inversa.'); return; }
  const inv = inverse(A, matRows);
  showMatResult('<p class="mat-op-label">A⁻¹ =</p>' + matToHTML(inv));
}

function matRank() {
  const A = getMatData('a', matRows, matCols);
  const r = rank(A, matRows, matCols);
  showMatResult(`<p class="mat-op-label">posto(A) =</p><p class="mat-scalar">${r}</p>`);
}

function clearMat() {
  ['a','b'].forEach(p => {
    const rows = p === 'a' ? matRows : matRows2;
    const cols = p === 'a' ? matCols : matCols2;
    for (let i = 0; i < rows; i++)
      for (let j = 0; j < cols; j++) {
        const el = document.getElementById(`${p}${i}_${j}`);
        if (el) el.value = '';
      }
  });
  document.getElementById('matResult').innerHTML = '';
}

/* ── Algoritmos ── */

function det(M, n) {
  if (n === 1) return M[0][0];
  if (n === 2) return M[0][0]*M[1][1] - M[0][1]*M[1][0];
  let d = 0;
  for (let j = 0; j < n; j++) {
    d += (j % 2 === 0 ? 1 : -1) * M[0][j] * det(minor(M, 0, j), n - 1);
  }
  return d;
}

function minor(M, row, col) {
  return M.filter((_, i) => i !== row).map(r => r.filter((_, j) => j !== col));
}

function inverse(M, n) {
  // Gauss-Jordan
  const aug = M.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => i === j ? 1 : 0)]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    const piv = aug[col][col];
    for (let k = 0; k < 2 * n; k++) aug[col][k] /= piv;
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const f = aug[row][col];
      for (let k = 0; k < 2 * n; k++) aug[row][k] -= f * aug[col][k];
    }
  }
  return aug.map(row => row.slice(n));
}

function rank(M, rows, cols) {
  const A = M.map(r => [...r]);
  let r = 0;
  for (let col = 0; col < cols && r < rows; col++) {
    let pivot = -1;
    for (let row = r; row < rows; row++) {
      if (Math.abs(A[row][col]) > 1e-12) { pivot = row; break; }
    }
    if (pivot === -1) continue;
    [A[r], A[pivot]] = [A[pivot], A[r]];
    const piv = A[r][col];
    for (let k = col; k < cols; k++) A[r][k] /= piv;
    for (let row = 0; row < rows; row++) {
      if (row === r) continue;
      const f = A[row][col];
      for (let k = col; k < cols; k++) A[row][k] -= f * A[r][k];
    }
    r++;
  }
  return r;
}

// Init
buildMatrixModule();
