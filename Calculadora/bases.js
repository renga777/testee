/* ═══════════════════════════════════════
   CONVERSÃO DE BASES
═══════════════════════════════════════ */

const BASE_DIGITS = {
  2:  '01',
  8:  '01234567',
  10: '0123456789',
  16: '0123456789ABCDEFabcdef'
};

let baseFrom = 10;

function setBaseFrom(b) {
  baseFrom = b;
  document.querySelectorAll('.base-tab').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-base="${b}"]`).classList.add('active');
  renderBaseKeyboard(b);
  const inp = document.getElementById('baseInput');
  inp.value = '';
  inp.placeholder = { 2:'Ex: 1010', 8:'Ex: 17', 10:'Ex: 42', 16:'Ex: 2A' }[b];
  clearBaseResult();
}

function renderBaseKeyboard(b) {
  const kb = document.getElementById('baseKeyboard');
  const digits = b === 16
    ? ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
    : Array.from(BASE_DIGITS[b]);

  kb.innerHTML = '';
  digits.forEach(d => {
    const btn = document.createElement('button');
    btn.className = 'btn num base-key';
    btn.textContent = d;
    btn.onclick = () => {
      document.getElementById('baseInput').value += d;
      convertBase();
    };
    kb.appendChild(btn);
  });

  // Backspace + Clear
  const bk = document.createElement('button');
  bk.className = 'btn op base-key';
  bk.textContent = '⌫';
  bk.onclick = () => {
    const inp = document.getElementById('baseInput');
    inp.value = inp.value.slice(0, -1);
    convertBase();
  };
  kb.appendChild(bk);

  const cl = document.createElement('button');
  cl.className = 'btn clear base-key';
  cl.textContent = 'AC';
  cl.onclick = () => {
    document.getElementById('baseInput').value = '';
    clearBaseResult();
  };
  kb.appendChild(cl);
}

function convertBase() {
  const raw = document.getElementById('baseInput').value.trim().toUpperCase();
  if (!raw) { clearBaseResult(); return; }

  // Validate
  const valid = BASE_DIGITS[baseFrom];
  for (const ch of raw) {
    if (!valid.toUpperCase().includes(ch)) {
      showBaseError(`Dígito inválido "${ch}" para base ${baseFrom}`);
      return;
    }
  }

  const decimal = parseInt(raw, baseFrom);
  if (isNaN(decimal)) { showBaseError('Valor inválido'); return; }

  const results = [
    { label: 'Decimal (10)',     value: decimal.toString(10).toUpperCase(),  base: 10 },
    { label: 'Binário (2)',      value: decimal.toString(2).toUpperCase(),   base: 2  },
    { label: 'Octal (8)',        value: decimal.toString(8).toUpperCase(),   base: 8  },
    { label: 'Hexadecimal (16)', value: decimal.toString(16).toUpperCase(),  base: 16 },
  ];

  const wrap = document.getElementById('baseResult');
  wrap.innerHTML = results.map(r => `
    <div class="base-result-row ${r.base === baseFrom ? 'base-origin' : ''}">
      <span class="base-label">${r.label}</span>
      <span class="base-value">${r.value}</span>
      <button class="base-copy-btn" onclick="copyBaseValue('${r.value}')" title="Copiar">⧉</button>
    </div>`).join('');

  // Tabela de bits (só para binário)
  if (decimal >= 0 && decimal <= 0xFFFF) {
    const bin = decimal.toString(2).padStart(Math.max(8, Math.ceil(decimal.toString(2).length / 8) * 8), '0');
    const groups = bin.match(/.{1,4}/g) || [];
    wrap.innerHTML += `<div class="base-bits">${groups.map(g =>
      `<span class="bit-group">${g.split('').map(b =>
        `<span class="bit ${b==='1'?'bit-on':'bit-off'}">${b}</span>`
      ).join('')}</span>`
    ).join('<span class="bit-sep"> </span>')}</div>`;
  }
}

function copyBaseValue(val) {
  navigator.clipboard.writeText(val).catch(() => {});
}

function showBaseError(msg) {
  document.getElementById('baseResult').innerHTML =
    `<span class="base-err">${msg}</span>`;
}

function clearBaseResult() {
  document.getElementById('baseResult').innerHTML = '';
}

// Init
renderBaseKeyboard(10);
